from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime as dt

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/timeline", tags=["timeline"])


@router.get("", response_model=List[schemas.TimelineEntry])
def get_timeline(
    investigation_id: str,
    start: Optional[dt.datetime] = None,
    end: Optional[dt.datetime] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    entries: List[schemas.TimelineEntry] = []

    if category in (None, "message"):
        for m in db.query(models.Message).filter(models.Message.investigation_id == investigation_id).all():
            entries.append(schemas.TimelineEntry(
                timestamp=m.timestamp, category="message",
                title=f"Message: {m.sender} -> {m.receiver}",
                detail=m.content, source_id=m.id,
            ))

    if category in (None, "call"):
        for c in db.query(models.CallLog).filter(models.CallLog.investigation_id == investigation_id).all():
            entries.append(schemas.TimelineEntry(
                timestamp=c.call_datetime, category="call",
                title=f"Call ({c.direction}): {c.contact}",
                detail=f"{c.duration_seconds}s", source_id=c.id,
            ))

    if category in (None, "location"):
        for l in db.query(models.LocationRecord).filter(models.LocationRecord.investigation_id == investigation_id).all():
            entries.append(schemas.TimelineEntry(
                timestamp=l.timestamp, category="location",
                title=f"Location fix ({l.location_source})",
                detail=f"{l.latitude:.5f}, {l.longitude:.5f}", source_id=l.id,
            ))

    if category in (None, "app"):
        for a in db.query(models.AppArtifact).filter(models.AppArtifact.investigation_id == investigation_id).all():
            entries.append(schemas.TimelineEntry(
                timestamp=a.timestamp, category="app",
                title=f"App activity: {a.application_name}",
                detail=a.artifact_summary, source_id=a.id,
            ))

    if category in (None, "ai_finding"):
        for f in db.query(models.AIFinding).filter(models.AIFinding.investigation_id == investigation_id).all():
            entries.append(schemas.TimelineEntry(
                timestamp=f.timestamp, category="ai_finding",
                title=f"AI Finding: {f.category}", detail=f.reason,
                priority=f.priority, source_id=f.id,
            ))

    if start:
        entries = [e for e in entries if e.timestamp >= start]
    if end:
        entries = [e for e in entries if e.timestamp <= end]
    if priority:
        entries = [e for e in entries if e.priority == priority]

    entries.sort(key=lambda e: e.timestamp)
    return entries
