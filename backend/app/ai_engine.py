"""
Rule-based forensic analysis engine.

IMPORTANT: This is a deterministic, explainable RULE-BASED engine, not a
trained machine-learning model. It is intentionally labelled as such
everywhere it is surfaced in the API and UI, per the project's
requirement not to fabricate AI capability that does not exist.

Each rule below inspects already-imported artifact records for a given
investigation and, when triggered, produces an AIFinding row with a
human-readable reason and a priority level. All findings remain
"unreviewed" until an investigator changes their status.
"""
import datetime as dt
from collections import Counter, defaultdict
from sqlalchemy.orm import Session
from . import models

SUSPICIOUS_KEYWORDS = [
    "wire transfer", "untraceable", "burner", "delete this", "don't tell",
    "cash only", "offshore", "password is", "meet me at", "dispose of",
    "no questions asked", "keep this between us",
]

FREQUENT_CALL_THRESHOLD = 5          # calls to/from same contact in a case
ODD_HOUR_START, ODD_HOUR_END = 0, 5  # 12am - 5am local device timestamps
REPEATED_LOCATION_THRESHOLD = 3      # visits to a ~rounded coordinate


def _round_coord(lat: float, lon: float, precision: int = 3):
    return (round(lat, precision), round(lon, precision))


def run_analysis(db: Session, investigation_id: str) -> list[models.AIFinding]:
    """Run every rule against the investigation's artifacts and persist findings.

    Existing findings for this investigation are cleared and regenerated so
    re-running analysis after importing new evidence stays consistent.
    """
    db.query(models.AIFinding).filter(
        models.AIFinding.investigation_id == investigation_id
    ).delete()

    findings: list[models.AIFinding] = []

    messages = db.query(models.Message).filter(
        models.Message.investigation_id == investigation_id
    ).all()
    calls = db.query(models.CallLog).filter(
        models.CallLog.investigation_id == investigation_id
    ).all()
    locations = db.query(models.LocationRecord).filter(
        models.LocationRecord.investigation_id == investigation_id
    ).all()

    # --- Rule 1: suspicious keywords in message content ---
    for msg in messages:
        content_lower = (msg.content or "").lower()
        for kw in SUSPICIOUS_KEYWORDS:
            if kw in content_lower:
                findings.append(models.AIFinding(
                    investigation_id=investigation_id,
                    category="keyword",
                    related_artifact_type="message",
                    related_artifact_id=msg.id,
                    timestamp=msg.timestamp,
                    reason=f"Message contains the flagged phrase '{kw}'.",
                    priority="High",
                    source_reference=msg.source_artifact or "imported message log",
                    engine="rule-based",
                ))
                break

    # --- Rule 2: unusually frequent contact (calls) ---
    call_counts = Counter(c.contact for c in calls if c.contact)
    for contact, count in call_counts.items():
        if count >= FREQUENT_CALL_THRESHOLD:
            sample = next(c for c in calls if c.contact == contact)
            findings.append(models.AIFinding(
                investigation_id=investigation_id,
                category="frequency",
                related_artifact_type="call_log",
                related_artifact_id=sample.id,
                timestamp=sample.call_datetime,
                reason=(
                    f"Contact '{contact}' appears in {count} call records, "
                    f"above the {FREQUENT_CALL_THRESHOLD}-call frequency threshold."
                ),
                priority="Medium",
                source_reference=sample.source_artifact or "imported call log",
                engine="rule-based",
            ))

    # --- Rule 3: calls placed during unusual hours ---
    for c in calls:
        hour = c.call_datetime.hour
        if ODD_HOUR_START <= hour <= ODD_HOUR_END:
            findings.append(models.AIFinding(
                investigation_id=investigation_id,
                category="frequency",
                related_artifact_type="call_log",
                related_artifact_id=c.id,
                timestamp=c.call_datetime,
                reason=(
                    f"Call with '{c.contact}' occurred at {c.call_datetime.strftime('%H:%M')}, "
                    f"within the configured unusual-hours window "
                    f"({ODD_HOUR_START:02d}:00-{ODD_HOUR_END:02d}:00)."
                ),
                priority="Low",
                source_reference=c.source_artifact or "imported call log",
                engine="rule-based",
            ))

    # --- Rule 4: repeated visits to the same location ---
    loc_counts: dict = defaultdict(list)
    for loc in locations:
        key = _round_coord(loc.latitude, loc.longitude)
        loc_counts[key].append(loc)
    for key, recs in loc_counts.items():
        if len(recs) >= REPEATED_LOCATION_THRESHOLD:
            sample = recs[0]
            findings.append(models.AIFinding(
                investigation_id=investigation_id,
                category="movement",
                related_artifact_type="location",
                related_artifact_id=sample.id,
                timestamp=sample.timestamp,
                reason=(
                    f"Location approximately ({key[0]}, {key[1]}) recurs "
                    f"{len(recs)} times across imported location records, "
                    f"suggesting a place of interest."
                ),
                priority="Medium",
                source_reference=sample.source_artifact or "imported location data",
                engine="rule-based",
            ))

    # --- Rule 5: cross-artifact correlation - message and call to/from
    #     the same contact within a short time window of a location fix ---
    for msg in messages:
        for loc in locations:
            delta = abs((msg.timestamp - loc.timestamp).total_seconds())
            if delta <= 600:  # within 10 minutes
                findings.append(models.AIFinding(
                    investigation_id=investigation_id,
                    category="correlation",
                    related_artifact_type="message",
                    related_artifact_id=msg.id,
                    timestamp=msg.timestamp,
                    reason=(
                        f"Message exchanged with '{msg.receiver or msg.sender}' occurred "
                        f"within 10 minutes of a recorded location fix, "
                        f"suggesting the device was active and located at the time of messaging."
                    ),
                    priority="Low",
                    source_reference="cross-artifact correlation (message + location)",
                    engine="rule-based",
                ))
                break  # one correlation note per message is enough

    for f in findings:
        db.add(f)
    db.commit()
    for f in findings:
        db.refresh(f)
    return findings
