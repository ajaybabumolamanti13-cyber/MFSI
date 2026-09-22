import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_change_password: bool
    user_id: str
    full_name: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    must_change_password: bool

    class Config:
        from_attributes = True


# ---------- Investigation ----------
class InvestigationCreate(BaseModel):
    case_name: str
    investigator_name: str
    case_description: Optional[str] = ""
    evidence_source: Optional[str] = ""
    consent_confirmed: bool = False


class InvestigationOut(BaseModel):
    id: str
    case_name: str
    investigator_name: str
    investigation_date: dt.datetime
    case_description: str
    evidence_source: str
    consent_confirmed: bool
    status: str
    created_at: dt.datetime

    class Config:
        from_attributes = True


# ---------- Device ----------
class DeviceCreate(BaseModel):
    investigation_id: str
    owner_reference: Optional[str] = ""
    brand: Optional[str] = ""
    model: Optional[str] = ""
    imei: Optional[str] = ""
    serial_number: Optional[str] = ""
    model_number: Optional[str] = ""
    mac_address: Optional[str] = ""
    ip_address: Optional[str] = ""
    os_type: Optional[str] = "Android"
    os_version: Optional[str] = ""
    timezone: Optional[str] = "UTC"
    notes: Optional[str] = ""


class DeviceOut(DeviceCreate):
    id: str
    acquisition_datetime: dt.datetime
    created_at: dt.datetime

    class Config:
        from_attributes = True


# ---------- Evidence ----------
class EvidenceOut(BaseModel):
    id: str
    investigation_id: str
    device_id: Optional[str]
    filename: str
    evidence_type: str
    file_size_bytes: int
    sha256_hash: str
    source_device: str
    acquisition_status: str
    processing_status: str
    is_demo_data: bool
    uploaded_at: dt.datetime

    class Config:
        from_attributes = True


# ---------- Messages / Calls / Location / Apps ----------
class MessageOut(BaseModel):
    id: str
    sender: str
    receiver: str
    content: str
    timestamp: dt.datetime
    message_type: str
    source_artifact: str
    has_attachment: bool
    flagged_keyword: str

    class Config:
        from_attributes = True


class CallLogOut(BaseModel):
    id: str
    contact: str
    direction: str
    call_datetime: dt.datetime
    duration_seconds: int
    source_artifact: str

    class Config:
        from_attributes = True


class LocationOut(BaseModel):
    id: str
    latitude: float
    longitude: float
    timestamp: dt.datetime
    location_source: str
    accuracy_m: Optional[float]
    source_artifact: str

    class Config:
        from_attributes = True


class AppArtifactOut(BaseModel):
    id: str
    application_name: str
    account_identifier: str
    artifact_summary: str
    timestamp: dt.datetime
    source_artifact: str
    is_encrypted_unavailable: bool

    class Config:
        from_attributes = True


# ---------- AI Findings ----------
class AIFindingOut(BaseModel):
    id: str
    category: str
    related_artifact_type: str
    related_artifact_id: str
    timestamp: dt.datetime
    reason: str
    priority: str
    source_reference: str
    review_status: str
    engine: str

    class Config:
        from_attributes = True


class ReviewStatusUpdate(BaseModel):
    review_status: str


# ---------- Reports ----------
class ReportOut(BaseModel):
    id: str
    investigation_id: str
    generated_at: dt.datetime
    generated_by: str
    summary: str

    class Config:
        from_attributes = True


# ---------- Timeline ----------
class TimelineEntry(BaseModel):
    timestamp: dt.datetime
    category: str  # message | call | location | app | ai_finding
    title: str
    detail: str
    priority: Optional[str] = None
    source_id: str
