import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

default_database_url = f"sqlite:///{os.path.join(tempfile.gettempdir(), 'mfis.db')}" if os.getenv("VERCEL") else "sqlite:///./mfis.db"
DATABASE_URL = os.getenv("MFIS_DATABASE_URL", default_database_url)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
