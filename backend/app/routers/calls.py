from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/calls", tags=["calls"])


@router.get("", response_model=List[schemas.CallLogOut])
def list_calls(
    investigation_id: str,
    contact: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(models.CallLog).filter(models.CallLog.investigation_id == investigation_id)
    if contact:
        query = query.filter(models.CallLog.contact.contains(contact))
    return query.order_by(models.CallLog.call_datetime.desc()).all()


@router.get("/frequent-contacts")
def frequent_contacts(investigation_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    from collections import Counter
    calls = db.query(models.CallLog).filter(models.CallLog.investigation_id == investigation_id).all()
    counts = Counter(c.contact for c in calls if c.contact)
    return [{"contact": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]
