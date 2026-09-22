from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/social", tags=["social"])


@router.get("", response_model=List[schemas.AppArtifactOut])
def list_app_artifacts(investigation_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.AppArtifact)
        .filter(models.AppArtifact.investigation_id == investigation_id)
        .order_by(models.AppArtifact.timestamp.desc())
        .all()
    )
