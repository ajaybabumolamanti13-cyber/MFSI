import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user
from ..report_generator import generate_html_report, generate_pdf_report

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/generate/{investigation_id}", response_model=schemas.ReportOut)
def generate_report(investigation_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = db.query(models.Investigation).filter(models.Investigation.id == investigation_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation not found")

    html_path = generate_html_report(db, investigation_id, current_user.full_name)
    pdf_path = generate_pdf_report(db, investigation_id, current_user.full_name)

    finding_count = db.query(models.AIFinding).filter(models.AIFinding.investigation_id == investigation_id).count()
    report = models.Report(
        investigation_id=investigation_id,
        generated_by=current_user.full_name,
        html_path=html_path,
        pdf_path=pdf_path,
        summary=f"Report generated with {finding_count} AI-assisted findings on record.",
    )
    db.add(report)
    db.add(models.AuditLog(user_id=current_user.id, action="generate_report", details=investigation_id))
    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=List[schemas.ReportOut])
def list_reports(investigation_id: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(models.Report)
    if investigation_id:
        q = q.filter(models.Report.investigation_id == investigation_id)
    return q.order_by(models.Report.generated_at.desc()).all()


@router.get("/{report_id}/html", response_class=HTMLResponse)
def view_report_html(report_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report or not os.path.exists(report.html_path):
        raise HTTPException(status_code=404, detail="Report not found")
    with open(report.html_path, "r", encoding="utf-8") as fh:
        return HTMLResponse(fh.read())


@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report or not os.path.exists(report.pdf_path):
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(report.pdf_path, media_type="application/pdf", filename=f"MFIS_Report_{report.investigation_id}.pdf")
