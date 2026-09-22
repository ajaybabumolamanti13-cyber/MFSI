from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from . import models
from .seed import seed_admin, seed_demo_case
from .routers import (
    auth, investigations, devices, evidence, messages, calls,
    location, social, ai_findings, timeline, reports, tools, dashboard,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mobile Forensic Intelligence System (MFIS) API",
    description="Academic digital forensics MVP backend. Rule-based AI, not a trained model.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(investigations.router)
app.include_router(devices.router)
app.include_router(evidence.router)
app.include_router(messages.router)
app.include_router(calls.router)
app.include_router(location.router)
app.include_router(social.router)
app.include_router(ai_findings.router)
app.include_router(timeline.router)
app.include_router(reports.router)
app.include_router(tools.router)
app.include_router(dashboard.router)


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        admin = seed_admin(db)
        seed_demo_case(db, admin)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "MFIS backend"}
