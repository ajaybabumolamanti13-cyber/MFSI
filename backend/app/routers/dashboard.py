from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total_cases = db.query(models.Investigation).count()
    open_cases = db.query(models.Investigation).filter(models.Investigation.status != "closed").count()
    total_evidence = db.query(models.EvidenceFile).count()
    total_findings = db.query(models.AIFinding).count()
    high_priority = db.query(models.AIFinding).filter(models.AIFinding.priority == "High").count()
    total_reports = db.query(models.Report).count()

    recent_cases = (
        db.query(models.Investigation)
        .order_by(models.Investigation.created_at.desc())
        .limit(5)
        .all()
    )
    recent_reports = (
        db.query(models.Report)
        .order_by(models.Report.generated_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "total_evidence_files": total_evidence,
        "total_ai_findings": total_findings,
        "high_priority_findings": high_priority,
        "total_reports": total_reports,
        "recent_cases": [{"id": c.id, "case_name": c.case_name, "status": c.status} for c in recent_cases],
        "recent_reports": [{"id": r.id, "investigation_id": r.investigation_id, "generated_at": r.generated_at} for r in recent_reports],
    }
