from fastapi import APIRouter, Depends
from .. import models
from ..security import get_current_user

router = APIRouter(prefix="/api/tools", tags=["tools"])

TOOLS = [
    {
        "id": "adb",
        "name": "ADB (Android Debug Bridge)",
        "purpose": "Controlled Android device interaction and supported logical data acquisition.",
        "integration_status": "Partially integrated",
        "availability_status": "Available if ADB is installed on the host machine",
        "supported_workflow": "Detect connected devices, run approved logical-pull acquisition, import artifacts",
        "action_label": "Configure",
    },
    {
        "id": "autopsy",
        "name": "Autopsy",
        "purpose": "Structured examination of extracted digital evidence.",
        "integration_status": "Import workflow only",
        "availability_status": "Requires Autopsy installed separately; MFIS imports its exports",
        "supported_workflow": "Import Autopsy-supported case exports (CSV/JSON) into an investigation",
        "action_label": "Import",
    },
    {
        "id": "cellebrite",
        "name": "Cellebrite Academic",
        "purpose": "Advanced mobile forensic extraction (where academic license is available).",
        "integration_status": "Import workflow only",
        "availability_status": "Requires a licensed Cellebrite Academic installation; not bundled",
        "supported_workflow": "Import compatible Cellebrite/UFDR exports and associate them with a case",
        "action_label": "Import",
    },
    {
        "id": "python",
        "name": "Python Analysis Engine",
        "purpose": "Backend orchestration, artifact parsing, rule-based AI analysis, report generation.",
        "integration_status": "Fully integrated",
        "availability_status": "Available (runs as part of the MFIS backend)",
        "supported_workflow": "Anomaly detection, cross-artifact correlation, HTML/PDF report generation",
        "action_label": "Open",
    },
    {
        "id": "sqlite",
        "name": "SQLite",
        "purpose": "Structured storage and querying of forensic artifacts and case metadata.",
        "integration_status": "Fully integrated",
        "availability_status": "Available (bundled database)",
        "supported_workflow": "Case, device, evidence, and finding persistence with case-based isolation",
        "action_label": "Open",
    },
]


@router.get("")
def list_tools(_=Depends(get_current_user)):
    return TOOLS
