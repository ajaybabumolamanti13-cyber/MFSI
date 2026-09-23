import os
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker, declarative_base

default_database_url = "sqlite:////tmp/mfis.db" if os.getenv("VERCEL") else "sqlite:///./mfis.db"
DATABASE_URL = os.getenv("MFIS_DATABASE_URL", default_database_url)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine_options = {"connect_args": connect_args}
if DATABASE_URL == "sqlite:///:memory:":
    engine_options["poolclass"] = StaticPool
engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
