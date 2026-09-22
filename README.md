# MFIS — Mobile Forensic Intelligence System

An academic Digital Forensics MVP: a web app that lets an investigator register a
case and device, import mobile forensic artifacts (messages, call logs, location
records, application data), run a rule-based anomaly-detection engine over them,
and generate a professional forensic report (HTML preview + downloadable PDF).

This is the ~75% MVP scope described in the project brief. See
**"Known limitations / reserved for future work"** below for exactly what is
stubbed or intentionally left out, and why.

---

## 1. Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 18 + TypeScript + Vite + Tailwind CSS + Recharts |
| Backend    | Python 3.11+ + FastAPI + Uvicorn |
| Database   | SQLite (via SQLAlchemy ORM) |
| Auth       | JWT bearer tokens + bcrypt password hashing (passlib) |
| Reports    | Server-rendered HTML + PDF (ReportLab) |
| AI module  | Deterministic **rule-based** analysis engine (Python) — see §6 |

---

## 2. Project structure

```
mfis/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, router registration, startup seeding
│   │   ├── database.py          # SQLAlchemy engine/session
│   │   ├── models.py            # ORM models (12 tables — see §7)
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── security.py          # Password hashing, JWT issuing/verification
│   │   ├── ai_engine.py         # Rule-based anomaly detection ("AI" module)
│   │   ├── report_generator.py  # HTML + PDF forensic report generation
│   │   ├── seed.py              # Creates admin user + a labelled demo case
│   │   └── routers/             # One router per feature area (auth, devices, ...)
│   ├── requirements.txt
│   ├── .env.example             # Copy to .env and edit before running
│   └── run.py                   # `python run.py` starts the API on :8000
└── frontend/
    ├── src/
    │   ├── pages/                # One page per sidebar item
    │   ├── components/           # Sidebar, Layout, DataTable, CaseSelector, ...
    │   ├── context/AuthContext.tsx
    │   └── api/client.ts         # Axios instance with bearer-token interceptor
    ├── package.json
    └── .env.example              # Copy to .env, points frontend at the API
```

---

## 3. Setup & run instructions

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: set MFIS_SECRET_KEY, MFIS_ADMIN_EMAIL, MFIS_ADMIN_PASSWORD

python run.py                   # Runs on http://localhost:8000
```

On first startup the backend automatically:
1. Creates all SQLite tables.
2. Creates the administrator account from your `.env` values
   (`must_change_password` is set to `true`, so you'll be forced to set a
   new password on first login — as required by the spec).
3. Seeds **one** investigation prefixed `[DEMO]` with clearly-labelled
   synthetic sample data, so the UI isn't empty on first run.

API docs (Swagger UI) are available at `http://localhost:8000/docs` once running.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # Defaults to http://localhost:8000 — fine for local dev
npm run dev                     # Runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser. You'll land on the login page.

### First login

Use the email/password you set in `backend/.env` (`MFIS_ADMIN_EMAIL` /
`MFIS_ADMIN_PASSWORD`). You will immediately be required to set a new
password before reaching the dashboard — this is enforced server-side,
not just in the UI.

> **Note on the credentials in the original project brief:** the brief
> listed a specific email address and the plaintext password `Harsha` as
> "initial development credentials." Those are **not** hardcoded anywhere
> in this codebase — they must be supplied via `backend/.env`, which is
> git-ignored. Do not commit real credentials to version control, and
> change the seeded password immediately after first login (the app
> requires this).

---

## 4. Implemented features (this MVP)

- Login with email/password, show/hide password toggle, session via JWT.
- Forced password change on first login; "current password" required to
  change it; passwords bcrypt-hashed, never returned by the API.
- Sidebar navigation matching the spec's 14 items, protected routes.
- Dashboard: live stats (cases, evidence, findings, reports) + a bar chart
  and recent-activity lists, pulled from the database.
- New Investigation form with consent/authorization checkbox (required to
  submit) and auto-generated Case ID.
- Device Information form (IMEI, serial, MAC, IP, OS, timezone, etc.),
  saved per investigation, listed in a device profile table.
- Evidence Acquisition: file upload (CSV/JSON/SQLite/TXT/XML/ZIP/UFDR),
  SHA-256 hashing on upload, progress bar, evidence inventory table.
  ADB / Autopsy / Cellebrite are represented as **import-workflow
  placeholders** (see §6) rather than live device/tool integrations.
- Messages / Call Log / Location / Social-Media analysis pages: search,
  filter by contact/date, frequent-contact and repeated-location surfacing.
- AI Insights page: runs the rule-based engine on demand, shows findings
  with priority badges, lets the investigator mark each
  reviewed/dismissed.
- Evidence Timeline: merges messages, calls, location, app activity and
  AI findings into one chronological, filterable feed.
- Forensic Reports: one-click generation of a full report (cover page,
  case/device/evidence detail, all artifact sections, AI findings,
  limitations, conclusion) as both an in-app HTML preview and a
  downloadable PDF. Reports are saved and can be reopened.
- Forensic Tools page: status cards for ADB / Autopsy / Cellebrite /
  Python / SQLite, each honestly labelled "fully integrated,"
  "partially integrated," or "import workflow only."
- Settings: change password, view account info.
- SQLite persistence for all of the above; basic audit log table
  (login, password change, case/device creation, evidence upload,
  AI run, review-status change, report generation).

## 5. Partially implemented / simplified for the MVP

- **Location map**: rendered as a coordinate scatter chart (Recharts)
  rather than a tiled interactive map (e.g. Leaflet + map tiles), to
  avoid pulling in a mapping tile provider/API key for an academic demo.
- **Evidence parsing**: uploaded files are stored, hashed, and tracked
  with a processing status, but MFIS does **not** automatically parse
  arbitrary CSV/JSON/SQLite structures into Messages/CallLogs/Location
  rows — that mapping is highly source-format-specific. The seeded demo
  case shows what *already-parsed* data looks like across every module;
  wiring a real per-format parser is listed below as reserved work.
- **ADB / Autopsy / Cellebrite**: import workflow and status UI exist;
  actually shelling out to `adb`, or parsing real Autopsy/Cellebrite
  export formats, is not implemented (this needs those tools/licenses
  present on the host, which an academic demo environment won't have).

## 6. The "AI" module, honestly described

`backend/app/ai_engine.py` implements a small set of **deterministic,
explainable rules** (keyword matching, call-frequency thresholds,
odd-hour detection, repeated-location clustering, message/location
time-correlation). It is labelled "rule-based" everywhere in the API
response (`engine: "rule-based"`) and in the UI. It is not a trained
machine-learning model — building/validating one was explicitly out of
scope for this MVP per the project brief, and the system never claims
otherwise.

## 7. Database tables

`users, investigations, devices, evidence_files, messages, call_logs,
location_records, app_artifacts, ai_findings, reports, audit_logs` — plus
the join implied by `investigation_id` / `evidence_id` foreign keys tying
every artifact back to its case, per the spec's requirement to maintain
source references and case-based isolation.

## 8. Security notes

- Passwords are hashed with bcrypt (`passlib`), never stored or returned
  in plaintext.
- All non-auth API routes require a valid bearer JWT
  (`Depends(get_current_user)`).
- Evidence files are hashed (SHA-256) on upload; uploads are size- and
  extension-checked.
- Secrets (JWT signing key, admin credentials) are read from environment
  variables via `.env`, which is git-ignored — nothing is hardcoded in
  source.
- This is an **academic MVP**, not a hardened production system. Before
  any real deployment you would want: HTTPS termination, rate limiting,
  refresh-token rotation, stricter CORS, per-case role-based access
  control (only "administrator" vs "investigator" roles currently exist
  at the schema level; the API doesn't yet enforce per-case ownership),
  and a security review of file upload handling.

## 9. Reserved for future development (the remaining ~25%)

- Full physical/locked-device extraction workflows.
- Complete iOS acquisition support.
- Real per-format artifact parsers (Cellebrite UFDR, Autopsy case
  exports, common Android/iOS backup formats) that populate
  Messages/CallLogs/Location automatically from an uploaded file.
- An actual trained ML model as an alternative to the rule-based engine,
  with a labelled validation dataset to report real accuracy metrics
  (the Performance page's "Not Yet Measured" fields are intentional —
  see below).
- Interactive tiled map for Location Analysis.
- Enterprise multi-investigator access control (case-level permissions,
  investigator roles beyond admin/investigator).
- Deeper ADB integration (live device detection/pull via `adb` shell-out)
  and live Autopsy/Cellebrite format parsers.
- A dedicated Performance Metrics page wiring real measured timings
  (the spec asks for "Not Yet Measured" placeholders rather than
  invented benchmarks — not yet built in this pass; add it under
  `routers/` + a `pages/Performance.tsx` following the existing pattern
  if needed).

## 10. Test credentials / initialization

No credentials are hardcoded. On first run, set:

```
MFIS_ADMIN_EMAIL=you@example.com
MFIS_ADMIN_PASSWORD=SomeTemporaryPassword123!
```

in `backend/.env` before starting the backend. You'll be forced to change
this password on first login.

## 11. Known limitations (summary)

- Rule-based, not ML-based, anomaly detection (by design, see §6).
- No automatic parsing of arbitrary uploaded evidence formats into
  structured artifacts (see §5).
- Map is a scatter chart, not a tiled interactive map.
- No per-case role-based access control beyond admin/investigator.
- Not penetration-tested; treat as an academic demonstration, not a
  production forensic tool.
