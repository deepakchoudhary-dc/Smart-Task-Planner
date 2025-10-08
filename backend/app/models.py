"""
SQLAlchemy database models for tasks and plans.
Defines the structure of persistent data storage.
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Plan(Base):
    """
    Represents a project plan with associated goal and metadata.
    A plan contains multiple tasks with dependencies.
    """
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    goal = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    total_duration = Column(Float)  # Total project duration in days
    deadline = Column(DateTime, nullable=True)  # Optional user-specified deadline
    critical_path = Column(JSON, nullable=True)  # Store critical path task IDs as JSON
    
    # Relationship to tasks
    tasks = relationship("Task", back_populates="plan", cascade="all, delete-orphan")


class Task(Base):
    """
    Represents an individual task within a plan.
    Includes PERT estimates (optimistic, most likely, pessimistic) and scheduling metadata.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    
    # PERT duration estimates in days
    optimistic_duration = Column(Float, nullable=False)
    most_likely_duration = Column(Float, nullable=False)
    pessimistic_duration = Column(Float, nullable=False)
    expected_duration = Column(Float)  # Calculated: (O + 4M + P) / 6
    
    # Scheduling results
    earliest_start = Column(Float)  # ES - earliest start time in days from project start
    earliest_finish = Column(Float)  # EF - earliest finish time
    latest_start = Column(Float)  # LS - latest start time
    latest_finish = Column(Float)  # LF - latest finish time
    slack = Column(Float)  # Float/slack time: LS - ES or LF - EF
    
    # Calendar dates (computed from project start date)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    # Dependencies stored as JSON list of task IDs
    dependencies = Column(JSON, default=list)  # List of prerequisite task IDs
    
    # Status tracking
    is_complete = Column(Integer, default=0)  # 0 = not started, 1 = complete
    is_on_critical_path = Column(Integer, default=0)  # 1 if on critical path
    
    # Relationship to plan
    plan = relationship("Plan", back_populates="tasks")
