"""
Unit tests for scheduling logic.
Tests CPM/PERT calculations, critical path detection and task dependencies.
"""

import pytest
from datetime import datetime, timedelta
from app.models import Task
from app.services import SchedulingService


class TestSchedulingService:
    """Test suite for SchedulingService."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.scheduling_service = SchedulingService()
    
    def test_simple_sequential_tasks(self):
        """Test scheduling with simple sequential dependencies."""
        tasks = [
            Task(
                id=0,
                plan_id=1,
                name="Task 1",
                optimistic_duration=1,
                most_likely_duration=2,
                pessimistic_duration=3,
                dependencies=[]
            ),
            Task(
                id=1,
                plan_id=1,
                name="Task 2",
                optimistic_duration=2,
                most_likely_duration=3,
                pessimistic_duration=4,
                dependencies=[0]
            ),
            Task(
                id=2,
                plan_id=1,
                name="Task 3",
                optimistic_duration=1,
                most_likely_duration=2,
                pessimistic_duration=3,
                dependencies=[1]
            )
        ]
        
        scheduled_tasks, critical_path, total_duration = self.scheduling_service.compute_schedule(tasks)
        
        # Verify task 1 starts at 0
        assert scheduled_tasks[0].earliest_start == 0.0
        assert scheduled_tasks[0].slack == 0.0
        
        # Verify task 2 starts after task 1
        assert scheduled_tasks[1].earliest_start == scheduled_tasks[0].earliest_finish
        
        # Verify task 3 starts after task 2
        assert scheduled_tasks[2].earliest_start == scheduled_tasks[1].earliest_finish
        
        # All tasks should be on critical path
        assert all(task.is_on_critical_path == 1 for task in scheduled_tasks)
        
        # Total duration should equal sum of expected durations
        expected_total = sum(task.expected_duration for task in scheduled_tasks)
        assert abs(total_duration - expected_total) < 0.01
    
    def test_parallel_tasks(self):
        """Test scheduling with parallel tasks."""
        tasks = [
            Task(
                id=0,
                plan_id=1,
                name="Start",
                optimistic_duration=1,
                most_likely_duration=1,
                pessimistic_duration=1,
                dependencies=[]
            ),
            Task(
                id=1,
                plan_id=1,
                name="Parallel 1",
                optimistic_duration=2,
                most_likely_duration=3,
                pessimistic_duration=4,
                dependencies=[0]
            ),
            Task(
                id=2,
                plan_id=1,
                name="Parallel 2",
                optimistic_duration=1,
                most_likely_duration=2,
                pessimistic_duration=3,
                dependencies=[0]
            ),
            Task(
                id=3,
                plan_id=1,
                name="End",
                optimistic_duration=1,
                most_likely_duration=1,
                pessimistic_duration=1,
                dependencies=[1, 2]
            )
        ]
        
        scheduled_tasks, critical_path, total_duration = self.scheduling_service.compute_schedule(tasks)
        
        # Parallel tasks should start at the same time
        assert scheduled_tasks[1].earliest_start == scheduled_tasks[2].earliest_start
        
        # End task should start after both parallel tasks finish
        assert scheduled_tasks[3].earliest_start == max(
            scheduled_tasks[1].earliest_finish,
            scheduled_tasks[2].earliest_finish
        )
        
        # Shorter parallel task should have slack
        if scheduled_tasks[1].expected_duration > scheduled_tasks[2].expected_duration:
            assert scheduled_tasks[2].slack > 0
        else:
            assert scheduled_tasks[1].slack > 0
    
    def test_no_dependencies(self):
        """Test tasks with no dependencies all start at time 0."""
        tasks = [
            Task(
                id=0,
                plan_id=1,
                name="Independent 1",
                optimistic_duration=1,
                most_likely_duration=2,
                pessimistic_duration=3,
                dependencies=[]
            ),
            Task(
                id=1,
                plan_id=1,
                name="Independent 2",
                optimistic_duration=2,
                most_likely_duration=3,
                pessimistic_duration=4,
                dependencies=[]
            )
        ]
        
        scheduled_tasks, critical_path, total_duration = self.scheduling_service.compute_schedule(tasks)
        
        # All tasks should start at time 0
        assert all(task.earliest_start == 0.0 for task in scheduled_tasks)
        
        # Total duration should be the longest task
        assert total_duration == max(task.expected_duration for task in scheduled_tasks)
    
    def test_pert_calculation(self):
        """Test PERT expected duration calculation: (O + 4M + P) / 6."""
        tasks = [
            Task(
                id=0,
                plan_id=1,
                name="PERT Test",
                optimistic_duration=2,
                most_likely_duration=5,
                pessimistic_duration=8,
                dependencies=[]
            )
        ]
        
        scheduled_tasks, _, _ = self.scheduling_service.compute_schedule(tasks)
        
        # Expected duration = (2 + 4*5 + 8) / 6 = 30 / 6 = 5.0
        expected = (2 + 4*5 + 8) / 6
        assert abs(scheduled_tasks[0].expected_duration - expected) < 0.01
    
    def test_calendar_dates(self):
        """Test that calendar dates are computed correctly."""
        start_date = datetime(2025, 1, 1, 0, 0, 0)
        
        tasks = [
            Task(
                id=0,
                plan_id=1,
                name="Task with dates",
                optimistic_duration=1,
                most_likely_duration=2,
                pessimistic_duration=3,
                dependencies=[]
            )
        ]
        
        scheduled_tasks, _, _ = self.scheduling_service.compute_schedule(tasks, start_date)
        
        # Start date should be the project start date
        assert scheduled_tasks[0].start_date == start_date
        
        # End date should be start date + expected duration
        expected_end = start_date + timedelta(days=scheduled_tasks[0].expected_duration)
        assert abs((scheduled_tasks[0].end_date - expected_end).total_seconds()) < 1
    
    def test_critical_path_identification(self):
        """Test that critical path is correctly identified."""
        tasks = [
            Task(
                id=0,
                plan_id=1,
                name="Start",
                optimistic_duration=1,
                most_likely_duration=1,
                pessimistic_duration=1,
                dependencies=[]
            ),
            Task(
                id=1,
                plan_id=1,
                name="Long path",
                optimistic_duration=5,
                most_likely_duration=10,
                pessimistic_duration=15,
                dependencies=[0]
            ),
            Task(
                id=2,
                plan_id=1,
                name="Short path",
                optimistic_duration=1,
                most_likely_duration=2,
                pessimistic_duration=3,
                dependencies=[0]
            ),
            Task(
                id=3,
                plan_id=1,
                name="End",
                optimistic_duration=1,
                most_likely_duration=1,
                pessimistic_duration=1,
                dependencies=[1, 2]
            )
        ]
        
        scheduled_tasks, critical_path, _ = self.scheduling_service.compute_schedule(tasks)
        
        # Long path should be on critical path
        assert scheduled_tasks[1].is_on_critical_path == 1
        assert scheduled_tasks[1].slack == 0.0
        
        # Short path should have slack
        assert scheduled_tasks[2].slack > 0
        assert scheduled_tasks[2].is_on_critical_path == 0
    
    def test_empty_task_list(self):
        """Test handling of empty task list."""
        scheduled_tasks, critical_path, total_duration = self.scheduling_service.compute_schedule([])
        
        assert scheduled_tasks == []
        assert critical_path == []
        assert total_duration == 0.0
    
    def test_invalid_dependency(self):
        """Test that circular dependencies raise an error."""
        tasks = [
            Task(
                id=0,
                plan_id=1,
                name="Task 1",
                optimistic_duration=1,
                most_likely_duration=2,
                pessimistic_duration=3,
                dependencies=[1]  # Depends on task 2
            ),
            Task(
                id=1,
                plan_id=1,
                name="Task 2",
                optimistic_duration=1,
                most_likely_duration=2,
                pessimistic_duration=3,
                dependencies=[0]  # Depends on task 1 - creates cycle
            )
        ]
        
        with pytest.raises(ValueError, match="cycle"):
            self.scheduling_service.compute_schedule(tasks)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
