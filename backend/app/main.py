"""
FastAPI application with REST endpoints for Smart Task Planner.
Provides API for plan creation, retrieval, updating and refinement.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
import requests

from . import models, schemas
from .database import engine, get_db, init_db
from .services import OllamaService, SchedulingService


# Initialize FastAPI app
app = FastAPI(
    title="Smart Task Planner API",
    description="AI-powered project planning with CPM/PERT scheduling",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ollama_service = OllamaService(host=os.getenv("OLLAMA_HOST", "http://localhost:11434"))
scheduling_service = SchedulingService()


@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    init_db()
    print("✓ Database initialized")
    print(f"✓ Ollama service configured at {ollama_service.host}")


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Smart Task Planner API",
        "version": "1.0.0"
    }


@app.post("/api/plan", response_model=schemas.PlanResponse, status_code=status.HTTP_201_CREATED, tags=["Plans"])
async def create_plan(plan_data: schemas.PlanCreate, db: Session = Depends(get_db)):
    """
    Create a new project plan from a goal.
    
    Steps:
    1. Call Qwen3 LLM to generate tasks from the goal
    2. Compute schedule using CPM/PERT
    3. Store plan and tasks in database
    4. Return complete plan with scheduling data
    """
    try:
        # Step 1: Generate tasks using LLM
        print(f"Generating tasks for goal: {plan_data.goal}")
        task_dicts = ollama_service.generate_tasks(plan_data.goal, plan_data.deadline)
        
        if not task_dicts:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate tasks from goal"
            )
        
        # Step 2: Create Plan object
        db_plan = models.Plan(
            goal=plan_data.goal,
            deadline=plan_data.deadline
        )
        db.add(db_plan)
        db.flush()  # Get plan ID without committing
        
        # Step 3: Create Task objects
        db_tasks = []
        for idx, task_dict in enumerate(task_dicts):
            db_task = models.Task(
                plan_id=db_plan.id,
                name=task_dict['name'],
                description=task_dict.get('description', ''),
                optimistic_duration=task_dict['optimistic_duration'],
                most_likely_duration=task_dict['most_likely_duration'],
                pessimistic_duration=task_dict['pessimistic_duration'],
                dependencies=task_dict.get('dependencies', [])
            )
            db_tasks.append(db_task)
        
        # Step 4: Compute schedule
        scheduled_tasks, critical_path, total_duration = scheduling_service.compute_schedule(
            db_tasks,
            start_date=None  # Use today as start date
        )
        
        # Step 5: Save tasks and update plan
        for task in scheduled_tasks:
            db.add(task)
        
        db_plan.total_duration = total_duration
        db_plan.critical_path = critical_path
        
        db.commit()
        db.refresh(db_plan)
        
        print(f"✓ Plan created: ID={db_plan.id}, Tasks={len(db_tasks)}, Duration={total_duration:.1f} days")
        
        return db_plan
        
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        print(f"Error creating plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating plan: {str(e)}"
        )


@app.get("/api/plans", response_model=List[schemas.PlanSummary], tags=["Plans"])
async def list_plans(db: Session = Depends(get_db)):
    """
    List all plans with summary information.
    Returns plan metadata without full task details.
    """
    plans = db.query(models.Plan).order_by(models.Plan.created_at.desc()).all()
    
    return [
        schemas.PlanSummary(
            id=plan.id,
            goal=plan.goal,
            created_at=plan.created_at,
            total_duration=plan.total_duration or 0.0,
            deadline=plan.deadline,
            task_count=len(plan.tasks)
        )
        for plan in plans
    ]


@app.get("/api/plan/{plan_id}", response_model=schemas.PlanResponse, tags=["Plans"])
async def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific plan with all tasks and scheduling data.
    """
    plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan {plan_id} not found"
        )
    
    return plan


@app.get("/api/plan/{plan_id}/insights", response_model=schemas.PlanInsights, tags=["Insights"])
async def get_plan_insights(plan_id: int, db: Session = Depends(get_db)):
    """Return analytics and recommendations for a specific plan."""
    plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan {plan_id} not found"
        )

    return scheduling_service.generate_insights(plan)


@app.put("/api/plan/{plan_id}/update", response_model=schemas.PlanResponse, tags=["Plans"])
async def update_plan(plan_id: int, update_data: schemas.PlanUpdate, db: Session = Depends(get_db)):
    """
    Update a plan with modified tasks and recompute schedule.
    Allows editing task durations, names, descriptions and dependencies.
    """
    plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan {plan_id} not found"
        )
    
    try:
        # Update tasks
        task_updates = {i: update for i, update in enumerate(update_data.tasks)}
        
        for i, task in enumerate(plan.tasks):
            if i in task_updates:
                update = task_updates[i]
                if update.name is not None:
                    task.name = update.name
                if update.description is not None:
                    task.description = update.description
                if update.optimistic_duration is not None:
                    task.optimistic_duration = update.optimistic_duration
                if update.most_likely_duration is not None:
                    task.most_likely_duration = update.most_likely_duration
                if update.pessimistic_duration is not None:
                    task.pessimistic_duration = update.pessimistic_duration
                if update.dependencies is not None:
                    task.dependencies = update.dependencies
                if update.is_complete is not None:
                    task.is_complete = 1 if update.is_complete else 0
        
        # Recompute schedule
        scheduled_tasks, critical_path, total_duration = scheduling_service.compute_schedule(
            plan.tasks,
            start_date=None
        )
        
        plan.total_duration = total_duration
        plan.critical_path = critical_path
        
        db.commit()
        db.refresh(plan)
        
        print(f"✓ Plan {plan_id} updated: Duration={total_duration:.1f} days")
        
        return plan
        
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating plan: {str(e)}"
        )


@app.post("/api/plan/{plan_id}/feedback", response_model=schemas.PlanResponse, tags=["Plans"])
async def refine_plan_with_feedback(
    plan_id: int, 
    feedback_data: schemas.FeedbackRequest, 
    db: Session = Depends(get_db)
):
    """
    Refine a plan based on user feedback using LLM reflection.
    The LLM reviews the current plan and user feedback to propose improvements.
    """
    plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan {plan_id} not found"
        )
    
    try:
        # Convert current tasks to dict format
        current_tasks = [
            {
                'name': task.name,
                'description': task.description,
                'optimistic_duration': task.optimistic_duration,
                'most_likely_duration': task.most_likely_duration,
                'pessimistic_duration': task.pessimistic_duration,
                'dependencies': task.dependencies
            }
            for task in plan.tasks
        ]
        
        # Get refined tasks from LLM
        refined_tasks = ollama_service.refine_plan_with_feedback(
            plan.goal,
            current_tasks,
            feedback_data.feedback
        )
        
        # Delete existing tasks
        for task in plan.tasks:
            db.delete(task)
        db.flush()
        
        # Create new tasks
        new_tasks = []
        for task_dict in refined_tasks:
            new_task = models.Task(
                plan_id=plan.id,
                name=task_dict['name'],
                description=task_dict.get('description', ''),
                optimistic_duration=task_dict['optimistic_duration'],
                most_likely_duration=task_dict['most_likely_duration'],
                pessimistic_duration=task_dict['pessimistic_duration'],
                dependencies=task_dict.get('dependencies', [])
            )
            new_tasks.append(new_task)
        
        # Compute new schedule
        scheduled_tasks, critical_path, total_duration = scheduling_service.compute_schedule(
            new_tasks,
            start_date=None
        )
        
        # Save new tasks
        for task in scheduled_tasks:
            db.add(task)
        
        plan.total_duration = total_duration
        plan.critical_path = critical_path
        
        db.commit()
        db.refresh(plan)
        
        print(f"✓ Plan {plan_id} refined with feedback")
        
        return plan
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refining plan: {str(e)}"
        )


@app.post("/api/plan/{plan_id}/natural-update", response_model=schemas.PlanResponse, tags=["Plans"])
async def natural_language_update(
    plan_id: int,
    update_data: schemas.NaturalLanguageUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a plan using natural language instructions.
    Examples: "add a testing phase after development", "shorten deployment by 2 days"
    """
    plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan {plan_id} not found"
        )
    
    try:
        # Convert current tasks to dict format
        current_tasks = [
            {
                'name': task.name,
                'description': task.description,
                'optimistic_duration': task.optimistic_duration,
                'most_likely_duration': task.most_likely_duration,
                'pessimistic_duration': task.pessimistic_duration,
                'dependencies': task.dependencies
            }
            for task in plan.tasks
        ]
        
        # Process natural language update
        updated_tasks = ollama_service.process_natural_language_update(
            plan.goal,
            current_tasks,
            update_data.instruction
        )
        
        # Delete existing tasks
        for task in plan.tasks:
            db.delete(task)
        db.flush()
        
        # Create updated tasks
        new_tasks = []
        for task_dict in updated_tasks:
            new_task = models.Task(
                plan_id=plan.id,
                name=task_dict['name'],
                description=task_dict.get('description', ''),
                optimistic_duration=task_dict['optimistic_duration'],
                most_likely_duration=task_dict['most_likely_duration'],
                pessimistic_duration=task_dict['pessimistic_duration'],
                dependencies=task_dict.get('dependencies', [])
            )
            new_tasks.append(new_task)
        
        # Compute new schedule
        scheduled_tasks, critical_path, total_duration = scheduling_service.compute_schedule(
            new_tasks,
            start_date=None
        )
        
        # Save new tasks
        for task in scheduled_tasks:
            db.add(task)
        
        plan.total_duration = total_duration
        plan.critical_path = critical_path
        
        db.commit()
        db.refresh(plan)
        
        print(f"✓ Plan {plan_id} updated via natural language")
        
        return plan
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing natural language update: {str(e)}"
        )


@app.delete("/api/plan/{plan_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Plans"])
async def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Delete a plan and all associated tasks.
    """
    plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan {plan_id} not found"
        )
    
    db.delete(plan)
    db.commit()
    
    print(f"✓ Plan {plan_id} deleted")
    
    return None


@app.get("/api/health/ollama", tags=["Health"])
async def check_ollama():
    """
    Check if Ollama service is available and Qwen3 model is installed.
    """
    try:
        response = requests.get(f"{ollama_service.host}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            model_names = [m.get("name", "") for m in models]
            has_qwen = any("qwen" in name.lower() for name in model_names)
            
            return {
                "status": "healthy",
                "ollama_host": ollama_service.host,
                "models_available": model_names,
                "qwen_installed": has_qwen,
                "configured_model": ollama_service.model
            }
        else:
            return {
                "status": "unhealthy",
                "error": f"Ollama returned status {response.status_code}"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "Make sure Ollama is running on localhost:11434"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
