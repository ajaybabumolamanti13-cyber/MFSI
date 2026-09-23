import uuid
import datetime as dt
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from .database import Base


def gen_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: gen_id("USR"))
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, default="Administrator")
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="investigator")  # investigator | administrator
    must_change_password = Column(Boolean, default=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)


class Investigation(Base):
    __tablename__ = "investigations"
    id = Column(String, primary_key=True, default=lambda: gen_id("CASE"))
    case_name = Column(String, nullable=False)
    investigator_name = Column(String, nullable=False)
    investigation_date = Column(DateTime, default=dt.datetime.utcnow)
    case_description = Column(Text, default="")
    evidence_source = Column(String, default="")
    consent_confirmed = Column(Boolean, default=False)
    status = Column(String, default="open")  # open | analyzing | closed
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    devices = relationship("Device", back_populates="investigation", cascade="all, delete-orphan")
    evidence_files = relationship("EvidenceFile", back_populates="investigation", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"
    id = Column(String, primary_key=True, default=lambda: gen_id("DEV"))
    investigation_id = Column(String, ForeignKey("investigations.id"))
    owner_reference = Column(String, default="")
    brand = Column(String, default="")
    model = Column(String, default="")
    imei = Column(String, default="")
    serial_number = Column(String, default="")
    model_number = Column(String, default="")
    mac_address = Column(String, default="")
    ip_address = Column(String, default="")
    os_type = Column(String, default="Android")  # Android | iOS
    os_version = Column(String, default="")
    acquisition_datetime = Column(DateTime, default=dt.datetime.utcnow)
    timezone = Column(String, default="UTC")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="devices")


class EvidenceFile(Base):
    __tablename__ = "evidence_files"
    id = Column(String, primary_key=True, default=lambda: gen_id("EVD"))
    investigation_id = Column(String, ForeignKey("investigations.id"))
    device_id = Column(String, ForeignKey("devices.id"), nullable=True)
    filename = Column(String, nullable=False)
    evidence_type = Column(String, default="unknown")  # csv | json | sqlite | text | image | adb | cellebrite | autopsy
    file_size_bytes = Column(Integer, default=0)
    stored_path = Column(String, default="")
    sha256_hash = Column(String, default="")
    source_device = Column(String, default="")
    acquisition_status = Column(String, default="uploaded")  # uploaded | processing | processed | failed
    processing_status = Column(String, default="pending")  # pending | parsed | not_supported
    is_demo_data = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=dt.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="evidence_files")


class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=lambda: gen_id("MSG"))
    investigation_id = Column(String, ForeignKey("investigations.id"))
    evidence_id = Column(String, ForeignKey("evidence_files.id"), nullable=True)
    sender = Column(String, default="")
    receiver = Column(String, default="")
    content = Column(Text, default="")
    timestamp = Column(DateTime, default=dt.datetime.utcnow)
    message_type = Column(String, default="SMS")  # SMS | iMessage | WhatsApp | etc
    source_artifact = Column(String, default="")
    has_attachment = Column(Boolean, default=False)
    flagged_keyword = Column(String, default="")


class CallLog(Base):
    __tablename__ = "call_logs"
    id = Column(String, primary_key=True, default=lambda: gen_id("CAL"))
    investigation_id = Column(String, ForeignKey("investigations.id"))
    evidence_id = Column(String, ForeignKey("evidence_files.id"), nullable=True)
    contact = Column(String, default="")
    direction = Column(String, default="outgoing")  # incoming | outgoing | missed
    call_datetime = Column(DateTime, default=dt.datetime.utcnow)
    duration_seconds = Column(Integer, default=0)
    source_artifact = Column(String, default="")


class LocationRecord(Base):
    __tablename__ = "location_records"
    id = Column(String, primary_key=True, default=lambda: gen_id("LOC"))
    investigation_id = Column(String, ForeignKey("investigations.id"))
    evidence_id = Column(String, ForeignKey("evidence_files.id"), nullable=True)
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=dt.datetime.utcnow)
    location_source = Column(String, default="")  # GPS | WiFi | Cell
    accuracy_m = Column(Float, nullable=True)
    source_artifact = Column(String, default="")


class AppArtifact(Base):
    __tablename__ = "app_artifacts"
    id = Column(String, primary_key=True, default=lambda: gen_id("APP"))
    investigation_id = Column(String, ForeignKey("investigations.id"))
    evidence_id = Column(String, ForeignKey("evidence_files.id"), nullable=True)
    application_name = Column(String, default="")
    account_identifier = Column(String, default="")
    artifact_summary = Column(Text, default="")
    timestamp = Column(DateTime, default=dt.datetime.utcnow)
    source_artifact = Column(String, default="")
    is_encrypted_unavailable = Column(Boolean, default=False)


class AIFinding(Base):
    __tablename__ = "ai_findings"
    id = Column(String, primary_key=True, default=lambda: gen_id("AIF"))
    investigation_id = Column(String, ForeignKey("investigations.id"))
    category = Column(String, default="")  # communication | movement | frequency | keyword | correlation
    related_artifact_type = Column(String, default="")
    related_artifact_id = Column(String, default="")
    timestamp = Column(DateTime, default=dt.datetime.utcnow)
    reason = Column(Text, default="")
    priority = Column(String, default="Low")  # Low | Medium | High
    source_reference = Column(String, default="")
    review_status = Column(String, default="unreviewed")  # unreviewed | reviewed | dismissed
    engine = Column(String, default="rule-based")  # rule-based | ai-model


class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, default=lambda: gen_id("RPT"))
    investigation_id = Column(String, ForeignKey("investigations.id"))
    generated_at = Column(DateTime, default=dt.datetime.utcnow)
    generated_by = Column(String, default="")
    html_path = Column(String, default="")
    pdf_path = Column(String, default="")
    summary = Column(Text, default="")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=lambda: gen_id("LOG"))
    user_id = Column(String, default="")
    action = Column(String, default="")
    details = Column(Text, default="")
    timestamp = Column(DateTime, default=dt.datetime.utcnow)
