"""
Seed the database with:
  1. The initial administrator account (from environment variables).
  2. One clearly-labelled DEMO investigation with synthetic sample
     artifacts, so the UI has something to show on first run without
     claiming real forensic evidence exists.

Per the project's integrity requirements, every seeded artifact record
is tied to an evidence file with is_demo_data=True, and the demo
investigation's case name is prefixed "[DEMO]".
"""
import os
import datetime as dt
from sqlalchemy.orm import Session
from . import models
from .security import hash_password


def seed_admin(db: Session):
    admin_email = os.getenv("MFIS_ADMIN_EMAIL", "admin@example.com")
    admin_password = os.getenv("MFIS_ADMIN_PASSWORD", "ChangeMe123!")

    existing = db.query(models.User).filter(models.User.email == admin_email).first()
    if existing:
        return existing

    user = models.User(
        email=admin_email,
        full_name="Administrator",
        hashed_password=hash_password(admin_password),
        role="administrator",
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed_demo_case(db: Session, admin: models.User):
    existing = db.query(models.Investigation).filter(
        models.Investigation.case_name.like("[DEMO]%")
    ).first()
    if existing:
        return existing

    now = dt.datetime.utcnow()
    case = models.Investigation(
        case_name="[DEMO] Sample Handset Review",
        investigator_name=admin.full_name,
        case_description=(
            "Synthetic demonstration case generated automatically on first "
            "launch. All artifacts below are clearly-labelled sample data, "
            "not real forensic evidence."
        ),
        evidence_source="Synthetic demo dataset",
        consent_confirmed=True,
        status="analyzing",
        created_by=admin.id,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    device = models.Device(
        investigation_id=case.id,
        owner_reference="Demo Subject",
        brand="Samsung",
        model="Galaxy S21 (Demo)",
        imei="000000000000000",
        serial_number="DEMO-SERIAL-001",
        model_number="SM-G991B",
        mac_address="00:00:00:00:00:00",
        ip_address="0.0.0.0",
        os_type="Android",
        os_version="13",
        timezone="UTC",
        notes="Synthetic demo device profile.",
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    evidence = models.EvidenceFile(
        investigation_id=case.id,
        device_id=device.id,
        filename="demo_extraction_bundle.json",
        evidence_type="json",
        file_size_bytes=4096,
        sha256_hash="0" * 64,
        source_device=f"{device.brand} {device.model}",
        acquisition_status="processed",
        processing_status="parsed",
        is_demo_data=True,
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    def t(days_ago, hour, minute=0):
        return now - dt.timedelta(days=days_ago, hours=(now.hour - hour), minutes=(now.minute - minute))

    demo_messages = [
        ("+1-555-0101", "+1-555-0199", "Are we still on for the meeting tomorrow?", "SMS", t(6, 9)),
        ("+1-555-0199", "+1-555-0101", "Yes, usual place. Cash only, no questions asked.", "SMS", t(6, 9, 4)),
        ("+1-555-0102", "+1-555-0101", "Don't forget to pick up groceries", "SMS", t(5, 18)),
        ("+1-555-0101", "+1-555-0103", "Wire transfer went through, delete this message after reading", "SMS", t(4, 2)),
        ("+1-555-0104", "+1-555-0101", "Happy birthday!", "SMS", t(3, 12)),
    ]
    for sender, receiver, content, mtype, ts in demo_messages:
        db.add(models.Message(
            investigation_id=case.id, evidence_id=evidence.id,
            sender=sender, receiver=receiver, content=content,
            timestamp=ts, message_type=mtype, source_artifact=evidence.filename,
        ))

    demo_calls = []
    for i in range(6):
        demo_calls.append(("+1-555-0199", "outgoing", t(6 - i, 1, 30), 245))
    demo_calls += [
        ("+1-555-0102", "incoming", t(5, 19), 60),
        ("+1-555-0103", "missed", t(4, 8), 0),
        ("+1-555-0104", "outgoing", t(3, 12, 5), 120),
    ]
    for contact, direction, ts, duration in demo_calls:
        db.add(models.CallLog(
            investigation_id=case.id, evidence_id=evidence.id,
            contact=contact, direction=direction, call_datetime=ts,
            duration_seconds=duration, source_artifact=evidence.filename,
        ))

    demo_locations = [
        (40.7128, -74.0060, t(6, 9, 2), "GPS", 5.0),
        (40.7128, -74.0059, t(6, 9, 3), "GPS", 6.0),
        (40.7130, -74.0061, t(5, 18, 1), "WiFi", 15.0),
        (40.7500, -73.9800, t(4, 2, 1), "GPS", 8.0),
        (40.7128, -74.0060, t(3, 12, 2), "GPS", 5.0),
    ]
    for lat, lon, ts, source, acc in demo_locations:
        db.add(models.LocationRecord(
            investigation_id=case.id, evidence_id=evidence.id,
            latitude=lat, longitude=lon, timestamp=ts,
            location_source=source, accuracy_m=acc, source_artifact=evidence.filename,
        ))

    demo_apps = [
        ("WhatsApp", "+1-555-0101", "Chat backup metadata (message bodies not available - end-to-end encrypted).", t(4, 10), True),
        ("Instagram", "demo.user.2026", "Login/session metadata only.", t(2, 16), False),
    ]
    for app_name, account, summary, ts, encrypted in demo_apps:
        db.add(models.AppArtifact(
            investigation_id=case.id, evidence_id=evidence.id,
            application_name=app_name, account_identifier=account,
            artifact_summary=summary, timestamp=ts,
            source_artifact=evidence.filename, is_encrypted_unavailable=encrypted,
        ))

    db.commit()
    return case
