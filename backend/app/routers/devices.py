from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("", response_model=List[schemas.DeviceOut])
def list_devices(investigation_id: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(models.Device)
    if investigation_id:
        q = q.filter(models.Device.investigation_id == investigation_id)
    return q.order_by(models.Device.created_at.desc()).all()


@router.post("", response_model=schemas.DeviceOut)
def create_device(payload: schemas.DeviceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = db.query(models.Investigation).filter(models.Investigation.id == payload.investigation_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation not found")
    device = models.Device(**payload.model_dump())
    db.add(device)
    db.add(models.AuditLog(user_id=current_user.id, action="create_device", details=f"{device.brand} {device.model}"))
    db.commit()
    db.refresh(device)
    return device
