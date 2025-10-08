"""
Pydantic schemas for request and response validation.
Provides type safety and automatic documentation for the API.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class TaskBase(BaseModel):
    """Base schema for task data."""
    name: str = Field(..., description="Task name", min_length=1, max_length=500)
    description: Optional[str] = Field(None, description="Detailed task description")
    optimistic_duration: float = Field(..., description="Optimistic duration estimate in days", gt=0)
    most_likely_duration: float = Field(..., description="Most likely duration estimate in days", gt=0)
    pessimistic_duration: float = Field(..., description="Pessimistic duration estimate in days", gt=0)
    dependencies: List[int] = Field(default_factory=list, description="List of prerequisite task IDs")


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    pass


class TaskUpdate(BaseModel):
    """Schema for updating an existing task."""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    optimistic_duration: Optional[float] = Field(None, gt=0)
    most_likely_duration: Optional[float] = Field(None, gt=0)
    pessimistic_duration: Optional[float] = Field(None, gt=0)
    dependencies: Optional[List[int]] = None
    is_complete: Optional[bool] = None


class TaskResponse(TaskBase):
    """Schema for task response with computed scheduling data."""
    id: int
    plan_id: int
    expected_duration: float = Field(..., description="Expected duration: (O + 4M + P) / 6")
    earliest_start: float = Field(..., description="Earliest start time in days")
    earliest_finish: float = Field(..., description="Earliest finish time in days")
    latest_start: float = Field(..., description="Latest start time in days")
    latest_finish: float = Field(..., description="Latest finish time in days")
    slack: float = Field(..., description="Slack/float time in days")
    start_date: Optional[datetime] = Field(None, description="Actual calendar start date")
    end_date: Optional[datetime] = Field(None, description="Actual calendar end date")
    is_complete: bool = Field(default=False, description="Task completion status")
    is_on_critical_path: bool = Field(default=False, description="Whether task is on critical path")

    class Config:
        from_attributes = True


class PlanCreate(BaseModel):
    """Schema for creating a new plan from a goal."""
    goal: str = Field(..., description="Project goal in natural language", min_length=1)
    deadline: Optional[datetime] = Field(None, description="Optional project deadline")


class PlanUpdate(BaseModel):
    """Schema for updating a plan with modified tasks."""
    tasks: List[TaskUpdate] = Field(..., description="Updated task list")


class FeedbackRequest(BaseModel):
    """Schema for user feedback to refine a plan."""
    feedback: str = Field(..., description="User feedback on the current plan", min_length=1)


class PlanResponse(BaseModel):
    """Schema for plan response with all tasks and metadata."""
    id: int
    goal: str
    created_at: datetime
    updated_at: datetime
    total_duration: float = Field(..., description="Total project duration in days")
    deadline: Optional[datetime]
    critical_path: List[int] = Field(..., description="List of task IDs on critical path")
    tasks: List[TaskResponse]

    class Config:
        from_attributes = True


class PlanSummary(BaseModel):
    """Schema for plan list/summary without full task details."""
    id: int
    goal: str
    created_at: datetime
    total_duration: float
    deadline: Optional[datetime]
    task_count: int = Field(..., description="Number of tasks in the plan")

    class Config:
        from_attributes = True


class NaturalLanguageUpdate(BaseModel):
    """Schema for natural language plan modifications."""
    instruction: str = Field(..., description="Natural language instruction to modify the plan", min_length=1)


class RiskTask(BaseModel):
    """Schema for representing high-risk tasks in plan insights."""
    id: int
    name: str
    slack: float
    expected_duration: float
    impact: str


class PlanInsights(BaseModel):
    """Schema for analytics and insights about a plan."""
    overall_risk: str
    progress_percentage: float
    average_slack: float
    zero_slack_tasks: int
    deadline_status: str
    deadline_message: str
    buffer_days: Optional[float]
    critical_path: List[str]
    high_risk_tasks: List[RiskTask]
    recommendations: List[str]
