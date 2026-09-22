from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/location", tags=["location"])


@router.get("", response_model=List[schemas.LocationOut])
def list_locations(investigation_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.LocationRecord)
        .filter(models.LocationRecord.investigation_id == investigation_id)
        .order_by(models.LocationRecord.timestamp.asc())
        .all()
    )
