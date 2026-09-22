import os
import hashlib
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".csv": "csv", ".json": "json", ".db": "sqlite", ".sqlite": "sqlite",
    ".txt": "text", ".xml": "text", ".zip": "image", ".ufdr": "cellebrite",
}
MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024  # 200 MB


@router.get("", response_model=List[schemas.EvidenceOut])
def list_evidence(investigation_id: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(models.EvidenceFile)
    if investigation_id:
        q = q.filter(models.EvidenceFile.investigation_id == investigation_id)
    return q.order_by(models.EvidenceFile.uploaded_at.desc()).all()


@router.post("/upload", response_model=schemas.EvidenceOut)
async def upload_evidence(
    investigation_id: str = Form(...),
    device_id: Optional[str] = Form(None),
    source_device: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    case = db.query(models.Investigation).filter(models.Investigation.id == investigation_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation not found")

    ext = os.path.splitext(file.filename or "")[1].lower()
    evidence_type = ALLOWED_EXTENSIONS.get(ext, "unknown")

    case_dir = os.path.join(UPLOAD_DIR, investigation_id)
    os.makedirs(case_dir, exist_ok=True)
    dest_path = os.path.join(case_dir, file.filename)

    hasher = hashlib.sha256()
    size = 0
    with open(dest_path, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_FILE_SIZE_BYTES:
                out.close()
                os.remove(dest_path)
                raise HTTPException(status_code=413, detail="File exceeds maximum allowed size (200MB)")
            hasher.update(chunk)
            out.write(chunk)

    evidence = models.EvidenceFile(
        investigation_id=investigation_id,
        device_id=device_id,
        filename=file.filename,
        evidence_type=evidence_type,
        file_size_bytes=size,
        stored_path=dest_path,
        sha256_hash=hasher.hexdigest(),
        source_device=source_device,
        acquisition_status="uploaded",
        processing_status="not_supported" if evidence_type == "unknown" else "pending",
        is_demo_data=False,
    )
    db.add(evidence)
    db.add(models.AuditLog(user_id=current_user.id, action="upload_evidence", details=file.filename))
    db.commit()
    db.refresh(evidence)
    return evidence


@router.post("/{evidence_id}/mark-processed", response_model=schemas.EvidenceOut)
def mark_processed(evidence_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    In this MVP, structured parsing of arbitrary uploaded files into
    Messages/CallLogs/Location records is out of scope (see README /
    'reserved for future development'). This endpoint marks an evidence
    file as reviewed/processed by the investigator without fabricating
    parsed content that was not actually extracted.
    """
    evidence = db.query(models.EvidenceFile).filter(models.EvidenceFile.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    if evidence.processing_status != "not_supported":
        evidence.processing_status = "parsed"
        evidence.acquisition_status = "processed"
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
    return evidence
