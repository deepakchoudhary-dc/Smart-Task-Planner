"""
Database configuration and session management.
Sets up SQLAlchemy engine and session factory for SQLite database.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Use SQLite for demo; can be replaced with PostgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smart_task_planner.db")

# Create engine with check_same_thread=False for SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

def get_db():
    """
    Dependency function to get database session.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database by creating all tables.
    Called on application startup.
    """
    Base.metadata.create_all(bind=engine)
