from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, ai_engine
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/run/{investigation_id}", response_model=List[schemas.AIFindingOut])
def run_ai_analysis(investigation_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = db.query(models.Investigation).filter(models.Investigation.id == investigation_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation not found")
    findings = ai_engine.run_analysis(db, investigation_id)
    db.add(models.AuditLog(user_id=current_user.id, action="run_ai_analysis", details=f"{len(findings)} findings for {investigation_id}"))
    db.commit()
    return findings


@router.get("/findings", response_model=List[schemas.AIFindingOut])
def list_findings(
    investigation_id: str,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(models.AIFinding).filter(models.AIFinding.investigation_id == investigation_id)
    if priority:
        q = q.filter(models.AIFinding.priority == priority)
    return q.order_by(models.AIFinding.timestamp.desc()).all()


@router.patch("/findings/{finding_id}/review", response_model=schemas.AIFindingOut)
def update_review_status(
    finding_id: str,
    payload: schemas.ReviewStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    finding = db.query(models.AIFinding).filter(models.AIFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    if payload.review_status not in {"unreviewed", "reviewed", "dismissed"}:
        raise HTTPException(status_code=400, detail="Invalid review status")
    finding.review_status = payload.review_status
    db.add(finding)
    db.add(models.AuditLog(user_id=current_user.id, action="review_finding", details=f"{finding_id} -> {payload.review_status}"))
    db.commit()
    db.refresh(finding)
    return finding
