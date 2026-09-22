"""
Forensic report generation: builds an HTML report and a PDF rendition
directly from the database records for one investigation. Nothing here
invents evidence - if a section has no records, it is rendered as
"No artifacts of this type were imported for this case."
"""
import os
import html
import datetime as dt
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from . import models

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports_output")
os.makedirs(REPORTS_DIR, exist_ok=True)


def _esc(v) -> str:
    return html.escape(str(v)) if v is not None else ""


def _collect(db: Session, investigation_id: str):
    case = db.query(models.Investigation).filter(models.Investigation.id == investigation_id).first()
    devices = db.query(models.Device).filter(models.Device.investigation_id == investigation_id).all()
    evidence = db.query(models.EvidenceFile).filter(models.EvidenceFile.investigation_id == investigation_id).all()
    messages = db.query(models.Message).filter(models.Message.investigation_id == investigation_id).all()
    calls = db.query(models.CallLog).filter(models.CallLog.investigation_id == investigation_id).all()
    locations = db.query(models.LocationRecord).filter(models.LocationRecord.investigation_id == investigation_id).all()
    apps = db.query(models.AppArtifact).filter(models.AppArtifact.investigation_id == investigation_id).all()
    findings = db.query(models.AIFinding).filter(models.AIFinding.investigation_id == investigation_id).all()
    return case, devices, evidence, messages, calls, locations, apps, findings


def generate_html_report(db: Session, investigation_id: str, generated_by: str) -> str:
    case, devices, evidence, messages, calls, locations, apps, findings = _collect(db, investigation_id)
    if case is None:
        raise ValueError("Investigation not found")

    now = dt.datetime.utcnow()
    high = sum(1 for f in findings if f.priority == "High")
    medium = sum(1 for f in findings if f.priority == "Medium")
    low = sum(1 for f in findings if f.priority == "Low")
    has_demo = any(e.is_demo_data for e in evidence)

    def rows_or_empty(rows_html: str, count: int, label: str) -> str:
        return rows_html if count else f"<tr><td colspan='8' class='empty'>No {label} were imported for this case.</td></tr>"

    device_rows = "".join(
        f"<tr><td>{_esc(d.brand)} {_esc(d.model)}</td><td>{_esc(d.os_type)} {_esc(d.os_version)}</td>"
        f"<td>{_esc(d.imei)}</td><td>{_esc(d.serial_number)}</td><td>{_esc(d.mac_address)}</td>"
        f"<td>{_esc(d.ip_address)}</td><td>{_esc(d.timezone)}</td></tr>" for d in devices
    )
    evidence_rows = "".join(
        f"<tr><td>{_esc(e.filename)}</td><td>{_esc(e.evidence_type)}</td><td>{e.file_size_bytes} B</td>"
        f"<td class='mono'>{_esc(e.sha256_hash)}</td><td>{_esc(e.acquisition_status)}</td>"
        f"<td>{'DEMO DATA' if e.is_demo_data else 'Imported'}</td></tr>" for e in evidence
    )
    message_rows = "".join(
        f"<tr><td>{_esc(m.timestamp)}</td><td>{_esc(m.sender)}</td><td>{_esc(m.receiver)}</td>"
        f"<td>{_esc(m.content)}</td><td>{_esc(m.message_type)}</td><td>{_esc(m.source_artifact)}</td></tr>"
        for m in messages
    )
    call_rows = "".join(
        f"<tr><td>{_esc(c.call_datetime)}</td><td>{_esc(c.contact)}</td><td>{_esc(c.direction)}</td>"
        f"<td>{c.duration_seconds}s</td><td>{_esc(c.source_artifact)}</td></tr>" for c in calls
    )
    location_rows = "".join(
        f"<tr><td>{_esc(l.timestamp)}</td><td>{l.latitude:.5f}, {l.longitude:.5f}</td>"
        f"<td>{_esc(l.location_source)}</td><td>{l.accuracy_m if l.accuracy_m is not None else '-'}</td>"
        f"<td>{_esc(l.source_artifact)}</td></tr>" for l in locations
    )
    app_rows = "".join(
        f"<tr><td>{_esc(a.application_name)}</td><td>{_esc(a.account_identifier)}</td>"
        f"<td>{_esc(a.artifact_summary)}</td><td>{_esc(a.timestamp)}</td>"
        f"<td>{'Encrypted / unavailable' if a.is_encrypted_unavailable else 'Available'}</td></tr>"
        for a in apps
    )
    finding_rows = "".join(
        f"<tr class='priority-{f.priority.lower()}'><td>{_esc(f.id)}</td><td>{_esc(f.category)}</td>"
        f"<td>{_esc(f.reason)}</td><td>{_esc(f.priority)}</td><td>{_esc(f.engine)}</td>"
        f"<td>{_esc(f.review_status)}</td></tr>" for f in findings
    )

    html_doc = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>MFIS Report - {_esc(case.id)}</title>
<style>
  body {{ font-family: 'Segoe UI', Arial, sans-serif; background:#0b1220; color:#e2e8f0; margin:0; padding:2rem; }}
  .cover {{ text-align:center; padding:3rem 1rem; border-bottom:2px solid #22d3ee; margin-bottom:2rem; }}
  .cover h1 {{ color:#22d3ee; letter-spacing:2px; }}
  h2 {{ color:#22d3ee; border-bottom:1px solid #334155; padding-bottom:.4rem; margin-top:2.5rem; }}
  table {{ width:100%; border-collapse:collapse; margin-top:.75rem; font-size:.85rem; }}
  th, td {{ border:1px solid #334155; padding:.5rem; text-align:left; vertical-align:top; }}
  th {{ background:#111827; color:#93c5fd; }}
  td.mono {{ font-family:monospace; font-size:.75rem; word-break:break-all; }}
  td.empty {{ text-align:center; color:#64748b; font-style:italic; }}
  .meta-grid {{ display:grid; grid-template-columns:1fr 1fr; gap:.5rem 2rem; background:#111827; padding:1rem; border-radius:8px; }}
  .badge {{ display:inline-block; padding:.2rem .6rem; border-radius:999px; font-size:.75rem; margin-right:.4rem; }}
  .badge-high {{ background:#7f1d1d; color:#fecaca; }}
  .badge-medium {{ background:#78350f; color:#fde68a; }}
  .badge-low {{ background:#14532d; color:#bbf7d0; }}
  .priority-high {{ background:rgba(239,68,68,0.08); }}
  .priority-medium {{ background:rgba(245,158,11,0.08); }}
  .priority-low {{ background:rgba(34,197,94,0.06); }}
  .demo-banner {{ background:#78350f; color:#fde68a; padding:.75rem 1rem; border-radius:8px; margin-bottom:1.5rem; }}
  .footer {{ margin-top:3rem; padding-top:1rem; border-top:1px solid #334155; color:#64748b; font-size:.8rem; }}
</style></head>
<body>
  <div class="cover">
    <h1>MOBILE FORENSIC INTELLIGENCE SYSTEM</h1>
    <p>Digital Forensic Investigation Report</p>
    <p>Case ID: <strong>{_esc(case.id)}</strong> &nbsp;|&nbsp; Generated: {now.isoformat(timespec='minutes')} UTC</p>
  </div>

  {"<div class='demo-banner'>This case contains synthetic DEMO DATA for demonstration purposes only. No real forensic evidence is represented in sections marked DEMO DATA.</div>" if has_demo else ""}

  <h2>1. Investigation Details</h2>
  <div class="meta-grid">
    <div><strong>Case Name:</strong> {_esc(case.case_name)}</div>
    <div><strong>Investigator:</strong> {_esc(case.investigator_name)}</div>
    <div><strong>Investigation Date:</strong> {_esc(case.investigation_date)}</div>
    <div><strong>Status:</strong> {_esc(case.status)}</div>
    <div><strong>Evidence Source:</strong> {_esc(case.evidence_source)}</div>
    <div><strong>Consent Confirmed:</strong> {"Yes" if case.consent_confirmed else "No"}</div>
  </div>
  <p>{_esc(case.case_description)}</p>

  <h2>2. Device Identification</h2>
  <table><tr><th>Device</th><th>OS</th><th>IMEI</th><th>Serial</th><th>MAC</th><th>IP</th><th>Timezone</th></tr>
  {rows_or_empty(device_rows, len(devices), "devices")}
  </table>

  <h2>3. Evidence Inventory (SHA-256)</h2>
  <table><tr><th>Filename</th><th>Type</th><th>Size</th><th>SHA-256</th><th>Status</th><th>Data Type</th></tr>
  {rows_or_empty(evidence_rows, len(evidence), "evidence files")}
  </table>

  <h2>4. SMS / Messages Analysis</h2>
  <table><tr><th>Timestamp</th><th>Sender</th><th>Receiver</th><th>Content</th><th>Type</th><th>Source</th></tr>
  {rows_or_empty(message_rows, len(messages), "messages")}
  </table>

  <h2>5. Call Log Analysis</h2>
  <table><tr><th>Date/Time</th><th>Contact</th><th>Direction</th><th>Duration</th><th>Source</th></tr>
  {rows_or_empty(call_rows, len(calls), "call log records")}
  </table>

  <h2>6. GPS &amp; Location Analysis</h2>
  <table><tr><th>Timestamp</th><th>Coordinates</th><th>Source</th><th>Accuracy (m)</th><th>Artifact</th></tr>
  {rows_or_empty(location_rows, len(locations), "location records")}
  </table>

  <h2>7. Social Media &amp; Application Artifacts</h2>
  <table><tr><th>Application</th><th>Account</th><th>Summary</th><th>Timestamp</th><th>Availability</th></tr>
  {rows_or_empty(app_rows, len(apps), "application artifacts")}
  </table>

  <h2>8. AI-Assisted Findings (Rule-Based Engine)</h2>
  <p><span class="badge badge-high">High: {high}</span><span class="badge badge-medium">Medium: {medium}</span><span class="badge badge-low">Low: {low}</span></p>
  <p><em>These findings were produced by a deterministic rule-based analysis engine, not a trained machine-learning model, and are not confirmed forensic conclusions. Every finding requires investigator review.</em></p>
  <table><tr><th>ID</th><th>Category</th><th>Reason</th><th>Priority</th><th>Engine</th><th>Review Status</th></tr>
  {rows_or_empty(finding_rows, len(findings), "AI findings")}
  </table>

  <h2>9. Limitations of the Analysis</h2>
  <ul>
    <li>This report reflects only artifacts that were imported into MFIS; it does not represent a complete device extraction.</li>
    <li>AI-assisted findings are generated by configurable rules and require investigator verification before use as evidence.</li>
    <li>Encrypted or unsupported application data is not accessible and is labelled accordingly above.</li>
    <li>Device identifiers (IMEI, MAC, IP) are recorded as case metadata only and were not used to retrieve remote data.</li>
  </ul>

  <h2>10. Conclusion</h2>
  <p>This report summarizes the artifacts imported and analyzed for case {_esc(case.id)} as of {now.date().isoformat()}.
  Investigators should treat all AI-assisted findings as leads requiring manual verification, not as final conclusions.</p>

  <div class="footer">Generated by Mobile Forensic Intelligence System (MFIS) &middot; Report generated by: {_esc(generated_by)} &middot; {now.isoformat(timespec='seconds')} UTC</div>
</body></html>"""

    path = os.path.join(REPORTS_DIR, f"{case.id}_{int(now.timestamp())}.html")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(html_doc)
    return path


def generate_pdf_report(db: Session, investigation_id: str, generated_by: str) -> str:
    case, devices, evidence, messages, calls, locations, apps, findings = _collect(db, investigation_id)
    if case is None:
        raise ValueError("Investigation not found")

    now = dt.datetime.utcnow()
    path = os.path.join(REPORTS_DIR, f"{case.id}_{int(now.timestamp())}.pdf")
    doc = SimpleDocTemplate(path, pagesize=LETTER, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("MFISTitle", parent=styles["Title"], textColor=colors.HexColor("#0b1220"))
    h2 = ParagraphStyle("MFISH2", parent=styles["Heading2"], textColor=colors.HexColor("#0f172a"), spaceBefore=14)
    body = styles["BodyText"]
    story = []

    story.append(Paragraph("MOBILE FORENSIC INTELLIGENCE SYSTEM", title_style))
    story.append(Paragraph("Digital Forensic Investigation Report", styles["Heading3"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Case ID: {case.id}", body))
    story.append(Paragraph(f"Generated: {now.isoformat(timespec='minutes')} UTC by {generated_by}", body))
    if any(e.is_demo_data for e in evidence):
        story.append(Spacer(1, 8))
        story.append(Paragraph(
            "NOTE: This case contains synthetic DEMO DATA for demonstration only.",
            ParagraphStyle("demo", parent=body, textColor=colors.HexColor("#92400e"))
        ))
    story.append(PageBreak())

    def add_table(headers, rows, empty_label):
        if not rows:
            story.append(Paragraph(f"No {empty_label} were imported for this case.", body))
            return
        data = [headers] + rows
        tbl = Table(data, repeatRows=1, hAlign="LEFT")
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 7.5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ]))
        story.append(tbl)

    story.append(Paragraph("1. Investigation Details", h2))
    story.append(Paragraph(f"<b>Case Name:</b> {case.case_name}", body))
    story.append(Paragraph(f"<b>Investigator:</b> {case.investigator_name}", body))
    story.append(Paragraph(f"<b>Status:</b> {case.status}", body))
    story.append(Paragraph(f"<b>Description:</b> {case.case_description}", body))
    story.append(Spacer(1, 8))

    story.append(Paragraph("2. Device Identification", h2))
    add_table(["Device", "OS", "IMEI", "Serial", "IP"],
              [[f"{d.brand} {d.model}", f"{d.os_type} {d.os_version}", d.imei, d.serial_number, d.ip_address] for d in devices],
              "devices")

    story.append(Paragraph("3. Evidence Inventory", h2))
    add_table(["Filename", "Type", "Size (B)", "Status", "Data Type"],
              [[e.filename, e.evidence_type, str(e.file_size_bytes), e.acquisition_status, "DEMO" if e.is_demo_data else "Imported"] for e in evidence],
              "evidence files")

    story.append(Paragraph("4. SMS / Messages Analysis", h2))
    add_table(["Timestamp", "Sender", "Receiver", "Content"],
              [[m.timestamp.strftime("%Y-%m-%d %H:%M"), m.sender, m.receiver, (m.content or "")[:60]] for m in messages],
              "messages")

    story.append(Paragraph("5. Call Log Analysis", h2))
    add_table(["Date/Time", "Contact", "Direction", "Duration (s)"],
              [[c.call_datetime.strftime("%Y-%m-%d %H:%M"), c.contact, c.direction, str(c.duration_seconds)] for c in calls],
              "call log records")

    story.append(Paragraph("6. GPS & Location Analysis", h2))
    add_table(["Timestamp", "Latitude", "Longitude", "Source"],
              [[l.timestamp.strftime("%Y-%m-%d %H:%M"), f"{l.latitude:.5f}", f"{l.longitude:.5f}", l.location_source] for l in locations],
              "location records")

    story.append(Paragraph("7. Social Media & Application Artifacts", h2))
    add_table(["Application", "Account", "Availability"],
              [[a.application_name, a.account_identifier, "Encrypted/unavailable" if a.is_encrypted_unavailable else "Available"] for a in apps],
              "application artifacts")

    story.append(Paragraph("8. AI-Assisted Findings (Rule-Based Engine)", h2))
    story.append(Paragraph(
        "These findings were produced by a deterministic rule-based analysis engine, not a trained "
        "machine-learning model, and require investigator review before use as evidence.", body))
    add_table(["Category", "Reason", "Priority", "Status"],
              [[f.category, (f.reason or "")[:70], f.priority, f.review_status] for f in findings],
              "AI findings")

    story.append(Paragraph("9. Limitations", h2))
    story.append(Paragraph(
        "This report reflects only artifacts imported into MFIS and does not represent a complete "
        "device extraction. AI-assisted findings require manual verification. Encrypted or unsupported "
        "application data is not accessible.", body))

    story.append(Paragraph("10. Conclusion", h2))
    story.append(Paragraph(
        f"This report summarizes artifacts imported and analyzed for case {case.id} as of "
        f"{now.date().isoformat()}. All AI-assisted findings should be treated as leads requiring "
        f"manual verification.", body))

    doc.build(story)
    return path
