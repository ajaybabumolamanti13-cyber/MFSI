from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/investigations", tags=["investigations"])


@router.get("", response_model=List[schemas.InvestigationOut])
def list_investigations(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Investigation).order_by(models.Investigation.created_at.desc()).all()


@router.post("", response_model=schemas.InvestigationOut)
def create_investigation(
    payload: schemas.InvestigationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not payload.consent_confirmed:
        raise HTTPException(status_code=400, detail="Authorization / consent confirmation is required")
    case = models.Investigation(
        case_name=payload.case_name,
        investigator_name=payload.investigator_name,
        case_description=payload.case_description or "",
        evidence_source=payload.evidence_source or "",
        consent_confirmed=payload.consent_confirmed,
        created_by=current_user.id,
    )
    db.add(case)
    db.add(models.AuditLog(user_id=current_user.id, action="create_investigation", details=case.case_name))
    db.commit()
    db.refresh(case)
    return case


@router.get("/{investigation_id}", response_model=schemas.InvestigationOut)
def get_investigation(investigation_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    case = db.query(models.Investigation).filter(models.Investigation.id == investigation_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return case
