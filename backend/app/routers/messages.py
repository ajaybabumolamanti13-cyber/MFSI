from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.get("", response_model=List[schemas.MessageOut])
def list_messages(
    investigation_id: str,
    contact: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(models.Message).filter(models.Message.investigation_id == investigation_id)
    if contact:
        query = query.filter(
            (models.Message.sender.contains(contact)) | (models.Message.receiver.contains(contact))
        )
    if q:
        query = query.filter(models.Message.content.contains(q))
    return query.order_by(models.Message.timestamp.desc()).all()
