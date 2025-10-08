"""
Core services for LLM integration and scheduling logic.
Handles task generation via Qwen3 and schedule computation using NetworkX.
"""

import json
import math
import re
from datetime import datetime, timedelta
from statistics import mean
from typing import Dict, List, Optional, Tuple

import networkx as nx
import requests

from .models import Task, Plan


class OllamaService:
    """
    Service for interacting with the local Ollama API.
    Uses Qwen3 model for task generation and plan refinement.
    """
    
    def __init__(self, host: str = "http://localhost:11434"):
        self.host = host
        self.model = "qwen3:1.7b"  # Using Qwen3 1.7B for better performance
        
    def generate_tasks(self, goal: str, deadline: Optional[datetime] = None) -> List[Dict]:
        """Generate domain-specific tasks from a goal using Qwen3."""

        attempts = [
            {
                "prompt": self._build_primary_prompt(goal, deadline),
                "description": "primary",
            },
            {
                "prompt": self._build_retry_prompt(goal, deadline),
                "description": "retry",
            },
        ]

        for attempt in attempts:
            try:
                tasks = self._request_structured_tasks(attempt["prompt"], attempt["description"], goal)
                if tasks:
                    return tasks
            except Exception as exc:  # pragma: no cover - logged for observability
                print(f"Task generation {attempt['description']} attempt failed: {exc}")

        # Final fallback: heuristic plan tailored to goal keywords
        return self._generate_dynamic_fallback(goal)

    def _request_structured_tasks(self, prompt: str, attempt_label: str, goal: str) -> Optional[List[Dict]]:
        payload: Dict[str, object] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }

        response = requests.post(
            f"{self.host}/api/generate",
            json=payload,
            timeout=120,
        )
        if response.status_code != 200:
            print(f"Ollama API ({attempt_label}) error: {response.status_code}")
            return None

        result = response.json()
        response_text = result.get("response", "")
        tasks = self._parse_tasks_from_response(response_text, goal)
        return tasks

    def _build_primary_prompt(self, goal: str, deadline: Optional[datetime]) -> str:
        deadline_str = f" The launch deadline is {deadline.strftime('%Y-%m-%d')} so ensure timelines are realistic." if deadline else ""

        return (
            "You are an elite programme manager creating an execution plan for a large enterprise. "
            "Break the goal down into concrete, domain-specific workstreams rather than generic phases."
            " Each task must be uniquely relevant to the goal, actionable, and written in concise business language."
            f"{deadline_str}\n\n"
            f"Goal: {goal}\n\n"
            "Return ONLY a JSON array (no markdown, no commentary) with 6-12 task objects. Each object must include:"
            "\n- name (<= 80 characters, domain-specific)"
            "\n- description (1-2 sentences detailing what happens)"
            "\n- optimistic_duration (float days > 0)"
            "\n- most_likely_duration (float days > 0)"
            "\n- pessimistic_duration (float days > 0)"
            "\n- dependencies (array of 0-based indices of prerequisite tasks; [] when none)"
            "\nAvoid placeholders like 'Planning', 'Development', 'Testing' unless the goal explicitly requires them."
            " Tailor the sequencing to enterprise readiness, compliance, go-to-market, stakeholder alignment, and risk mitigation."
        )

    def _build_retry_prompt(self, goal: str, deadline: Optional[datetime]) -> str:
        deadline_hint = f" Honour the target completion date of {deadline.strftime('%Y-%m-%d')}." if deadline else ""

        return (
            "Produce a structured execution plan tailored to the following enterprise initiative."
            " Respond with RAW JSON ONLY (no code fences, no prose)."
            f"{deadline_hint}\n\n"
            f"Initiative: {goal}\n\n"
            "Rules:"
            "\n1. Create between 6 and 12 tasks, each describing a unique deliverable."
            "\n2. Prefer specialised terminology (e.g., regulatory submission, stakeholder enablement, pharmacovigilance) when applicable."
            "\n3. Provide numeric duration estimates in days; use decimal numbers if needed."
            "\n4. dependencies must list indices of prerequisite tasks; do not use names."
            "\n5. Return a top-level JSON array; do not include a wrapping object or comments."
        )
    
    def _parse_tasks_from_response(self, response_text: str, goal: str) -> Optional[List[Dict]]:
        """
        Parse task list from LLM response.
        Handles various JSON formats and cleans the response.
        """
        try:
            cleaned = response_text.strip()

            # Attempt direct JSON parsing first
            if cleaned.startswith("[") and cleaned.endswith("]"):
                candidate = json.loads(cleaned)
            else:
                # Try to locate a JSON code block or array within the text
                code_block_match = re.search(r"```json\s*(\[.*?\])\s*```", cleaned, re.DOTALL | re.IGNORECASE)
                if code_block_match:
                    candidate = json.loads(code_block_match.group(1))
                else:
                    json_match = re.search(r"\[.*\]", cleaned, re.DOTALL)
                    if not json_match:
                        return None
                    candidate = json.loads(json_match.group(0))

            if not isinstance(candidate, list):
                return None

            # Try to find JSON array in the response
            cleaned_tasks: List[Dict] = []
            for idx, task in enumerate(candidate):
                if not isinstance(task, dict):
                    continue

                if not all(key in task for key in ("name", "optimistic_duration", "most_likely_duration", "pessimistic_duration")):
                    continue

                def _to_positive_float(value: object, fallback: float) -> float:
                    try:
                        numeric = float(value)
                        if math.isfinite(numeric) and numeric > 0:
                            return numeric
                    except (TypeError, ValueError):
                        pass
                    return fallback

                optimistic = _to_positive_float(task.get("optimistic_duration"), 1.0)
                most_likely = _to_positive_float(task.get("most_likely_duration"), max(optimistic, 1.5))
                pessimistic = _to_positive_float(task.get("pessimistic_duration"), max(most_likely * 1.5, 3.0))

                dependencies_raw = task.get("dependencies", []) or []
                dependencies: List[int] = []
                if isinstance(dependencies_raw, list):
                    for dep in dependencies_raw:
                        try:
                            dep_idx = int(dep)
                            if 0 <= dep_idx < 50 and dep_idx != idx:
                                dependencies.append(dep_idx)
                        except (TypeError, ValueError):
                            continue

                cleaned_task = {
                    "name": str(task.get("name", "Task")).strip()[:120],
                    "description": str(task.get("description", goal)).strip()[:1000],
                    "optimistic_duration": optimistic,
                    "most_likely_duration": most_likely,
                    "pessimistic_duration": max(pessimistic, most_likely, optimistic),
                    "dependencies": dependencies,
                }
                cleaned_tasks.append(cleaned_task)

            return cleaned_tasks or None

        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"Error parsing tasks: {e}")
            return None
    
    def _generate_dynamic_fallback(self, goal: str) -> List[Dict]:
        """Heuristic fallback that tailors phases to the goal when the LLM fails."""

        goal_lower = goal.lower()
        task_templates: List[Dict[str, object]]

        if any(keyword in goal_lower for keyword in ("drug", "pharma", "clinical", "fda", "medical")):
            task_templates = [
                (
                    "Regulatory & Compliance Scoping",
                    f"Identify regulatory pathways, target markets, and approval requirements related to {goal}.",
                ),
                (
                    "Clinical Evidence Alignment",
                    "Align clinical data packages and safety profiles to meet regulatory expectations.",
                ),
                (
                    "Manufacturing Scale-Up",
                    "Secure GMP manufacturing capacity, validate batches, and prepare quality documentation.",
                ),
                (
                    "Market Access & Pricing Strategy",
                    "Model reimbursement scenarios, prepare HTA dossiers, and finalise launch pricing.",
                ),
                (
                    "Stakeholder & Medical Affairs Enablement",
                    "Train field medical teams, develop risk mitigation plans, and ready educational materials.",
                ),
                (
                    "Launch Readiness & Pharmacovigilance",
                    "Coordinate commercial launch go/no-go, setup safety surveillance, and execute rollout.",
                ),
            ]
        elif any(keyword in goal_lower for keyword in ("product", "saas", "software", "platform")):
            task_templates = [
                ("Product Vision & OKR Alignment", "Clarify customer outcomes, enterprise KPIs, and release roadmap."),
                ("Solution Architecture & Security Review", "Design target architecture, perform threat modelling, and secure approvals."),
                ("Implementation & Integrations", "Build features, APIs, and integrations prioritised for MVP adoption."),
                ("Quality Engineering & Performance Tuning", "Execute automated testing, load tests, and resolve critical defects."),
                ("Customer Enablement & Support Playbooks", "Prepare documentation, onboarding assets, and 24/7 support coverage."),
                ("Launch Operations & Post-Go-Live Monitoring", "Run launch checklist, monitor telemetry, and execute hyper-care plan."),
            ]
        elif any(keyword in goal_lower for keyword in ("marketing", "campaign", "event", "growth")):
            task_templates = [
                ("Audience & Positioning Research", "Validate personas, segment audiences, and refine value propositions."),
                ("Campaign Creative & Asset Production", "Produce messaging, creative assets, and localisation per channel."),
                ("Channel Orchestration", "Plan omnichannel rollout, media buys, and automation journeys."),
                ("Enablement & Launch Communications", "Align sales, PR, and stakeholders with launch materials."),
                ("Execution & Real-Time Optimisation", "Launch campaigns, monitor performance, and optimise in-flight."),
                ("Measurement & Post-Mortem", "Consolidate analytics, assess ROI, and capture learnings for iteration."),
            ]
        else:
            task_templates = [
                ("Stakeholder Alignment & Vision", f"Align sponsors and stakeholders on the objectives for: {goal}"),
                ("Solution Definition", "Translate the goal into measurable outcomes, scope, and guardrails."),
                ("Delivery Planning", "Sequence workstreams, allocate teams, and establish programme governance."),
                ("Execution & Quality Control", "Run focused workstreams with quality and risk management at enterprise standards."),
                ("Enablement & Change Management", "Prepare end users, documentation, and support processes for adoption."),
                ("Launch & Continuous Improvement", "Deliver the outcome, monitor success metrics, and feed insights into the roadmap."),
            ]

        tasks: List[Dict] = []
        for idx, (name, description) in enumerate(task_templates):
            tasks.append(
                {
                    "name": name,
                    "description": description,
                    "optimistic_duration": max(1.0, 1.5 + idx * 0.5),
                    "most_likely_duration": max(2.0, 3.0 + idx * 0.75),
                    "pessimistic_duration": max(3.5, 4.5 + idx * 1.0),
                    "dependencies": list(range(idx)) if idx > 0 else [],
                }
            )

        return tasks
    
    def refine_plan_with_feedback(self, goal: str, current_tasks: List[Dict], feedback: str) -> List[Dict]:
        """
        Use LLM to refine a plan based on user feedback.
        Implements reflective planning.
        
        Args:
            goal: Original project goal
            current_tasks: Current task list
            feedback: User feedback on the plan
            
        Returns:
            Refined list of tasks
        """
        tasks_json = json.dumps(current_tasks, indent=2)
        
        prompt = f"""You are a project planning expert. Review and refine the following project plan based on user feedback.

Goal: {goal}

Current Plan:
{tasks_json}

User Feedback: {feedback}

Return an updated JSON array of tasks incorporating the feedback. Maintain the same format with name, description, optimistic_duration, most_likely_duration, pessimistic_duration, and dependencies.

Return ONLY the JSON array, no additional text."""

        try:
            response = requests.post(
                f"{self.host}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get("response", "")
                tasks = self._parse_tasks_from_response(response_text)
                
                if tasks:
                    return tasks
                else:
                    # Return original tasks if parsing fails
                    return current_tasks
            else:
                return current_tasks
                
        except Exception as e:
            print(f"Error refining plan: {e}")
            return current_tasks
    
    def process_natural_language_update(self, goal: str, current_tasks: List[Dict], instruction: str) -> List[Dict]:
        """
        Process natural language instructions to modify the plan.
        Examples: "add a testing phase", "shorten development by 2 days"
        
        Args:
            goal: Original project goal
            current_tasks: Current task list
            instruction: Natural language modification instruction
            
        Returns:
            Updated list of tasks
        """
        return self.refine_plan_with_feedback(goal, current_tasks, instruction)


class SchedulingService:
    """
    Service for computing project schedules using graph algorithms.
    Implements CPM (Critical Path Method) and PERT analysis.
    """
    
    def compute_schedule(
        self, 
        tasks: List[Task], 
        start_date: Optional[datetime] = None
    ) -> Tuple[List[Task], List[int], float]:
        """
        Compute project schedule using CPM/PERT.
        
        Args:
            tasks: List of Task objects with durations and dependencies
            start_date: Project start date (defaults to today)
            
        Returns:
            Tuple of (scheduled_tasks, critical_path_ids, total_duration)
        """
        if not tasks:
            return [], [], 0.0
        
        if start_date is None:
            start_date = datetime.now()
        
        # Step 1: Calculate expected durations using PERT formula
        for task in tasks:
            task.expected_duration = (
                task.optimistic_duration + 
                4 * task.most_likely_duration + 
                task.pessimistic_duration
            ) / 6.0
        
        # Step 2: Build dependency graph
        G = nx.DiGraph()
        
        # Create a mapping from task position to task object
        task_map = {i: task for i, task in enumerate(tasks)}
        
        # Add nodes with weights (expected durations)
        for i, task in enumerate(tasks):
            G.add_node(i, weight=task.expected_duration, task=task)
        
        # Add edges for dependencies
        for i, task in enumerate(tasks):
            if task.dependencies:
                for dep_idx in task.dependencies:
                    if 0 <= dep_idx < len(tasks):
                        G.add_edge(dep_idx, i)
        
        # Step 3: Verify DAG (no cycles)
        if not nx.is_directed_acyclic_graph(G):
            raise ValueError("Task dependencies contain a cycle. Please check dependencies.")
        
        # Step 4: Topological sort to get valid task ordering
        topo_order = list(nx.topological_sort(G))
        
        # Step 5: Forward pass - calculate ES and EF
        earliest_start = {}
        earliest_finish = {}
        
        for node in topo_order:
            task = task_map[node]
            predecessors = list(G.predecessors(node))
            
            if not predecessors:
                # No predecessors: start at time 0
                earliest_start[node] = 0.0
            else:
                # Start after all predecessors finish
                earliest_start[node] = max(earliest_finish[pred] for pred in predecessors)
            
            earliest_finish[node] = earliest_start[node] + task.expected_duration
        
        # Total project duration
        total_duration = max(earliest_finish.values()) if earliest_finish else 0.0
        
        # Step 6: Backward pass - calculate LS and LF
        latest_start = {}
        latest_finish = {}
        
        for node in reversed(topo_order):
            task = task_map[node]
            successors = list(G.successors(node))
            
            if not successors:
                # No successors: must finish by project end
                latest_finish[node] = total_duration
            else:
                # Must finish before earliest successor starts
                latest_finish[node] = min(latest_start[succ] for succ in successors)
            
            latest_start[node] = latest_finish[node] - task.expected_duration
        
        # Step 7: Calculate slack and identify critical path
        slack = {}
        critical_path_nodes = []
        
        for node in G.nodes():
            slack[node] = latest_start[node] - earliest_start[node]
            if abs(slack[node]) < 0.01:  # Floating point tolerance
                critical_path_nodes.append(node)
        
        # Step 8: Update task objects with computed values
        for i, task in enumerate(tasks):
            task.earliest_start = earliest_start[i]
            task.earliest_finish = earliest_finish[i]
            task.latest_start = latest_start[i]
            task.latest_finish = latest_finish[i]
            task.slack = slack[i]
            task.is_on_critical_path = 1 if i in critical_path_nodes else 0
            
            # Calculate calendar dates
            task.start_date = start_date + timedelta(days=task.earliest_start)
            task.end_date = start_date + timedelta(days=task.earliest_finish)
        
        # Step 9: Find the actual critical path (longest path through the DAG)
        try:
            critical_path = nx.dag_longest_path(G, weight='weight')
        except:
            critical_path = critical_path_nodes
        
        return tasks, critical_path, total_duration

    def generate_insights(self, plan: Plan) -> Dict:
        """Generate analytics and actionable insights for a plan."""
        tasks = list(plan.tasks or [])
        total_tasks = len(tasks)

        if total_tasks == 0:
            return {
                "overall_risk": "Low",
                "progress_percentage": 0.0,
                "average_slack": 0.0,
                "zero_slack_tasks": 0,
                "deadline_status": "No schedule",
                "deadline_message": "No tasks available to analyse",
                "buffer_days": None,
                "critical_path": [],
                "high_risk_tasks": [],
                "recommendations": [
                    "Generate tasks for this plan to unlock scheduling insights."
                ],
            }

        completed_tasks = sum(1 for task in tasks if getattr(task, "is_complete", 0))
        progress_percentage = round((completed_tasks / total_tasks) * 100, 2)

        slack_values = [float(task.slack) for task in tasks if task.slack is not None]
        average_slack = round(mean(slack_values), 2) if slack_values else 0.0
        zero_slack_tasks = len([task for task in tasks if (task.slack or 0) <= 0.1])

        critical_path = plan.critical_path or []
        critical_path_names: List[str] = []
        for node in critical_path:
            if isinstance(node, int) and 0 <= node < total_tasks:
                critical_path_names.append(tasks[node].name)
            else:
                critical_path_names.append(str(node))
        if not critical_path_names:
            critical_path_names = [task.name for task in tasks if getattr(task, "is_on_critical_path", 0)]

        high_risk_candidates: List[Dict] = []
        for task in tasks:
            slack_value = float(task.slack) if task.slack is not None else 0.0
            if slack_value < 1.0 and not getattr(task, "is_complete", 0):
                impact = "Critical" if getattr(task, "is_on_critical_path", 0) else "High"
                high_risk_candidates.append({
                    "id": task.id,
                    "name": task.name,
                    "slack": round(slack_value, 2),
                    "expected_duration": round((task.expected_duration or 0.0), 2),
                    "impact": impact,
                })

        high_risk_tasks = sorted(high_risk_candidates, key=lambda item: item["slack"])[:5]

        buffer_days: Optional[float] = None
        deadline_status = "No deadline"
        if plan.deadline:
            start_dates = [task.start_date for task in tasks if task.start_date]
            baseline_start = min(start_dates) if start_dates else datetime.now()
            days_available = (plan.deadline - baseline_start).total_seconds() / 86400
            buffer_days = round(days_available - (plan.total_duration or 0.0), 2)

            if buffer_days >= 5:
                deadline_status = "On track"
                deadline_message = f"Deadline achievable with {buffer_days} days of buffer."
            elif buffer_days >= 0:
                deadline_status = "At risk"
                deadline_message = f"Deadline is achievable but only {buffer_days} days of buffer remain."
            else:
                deadline_status = "Behind"
                deadline_message = f"Schedule exceeds the deadline by {abs(buffer_days)} days."
        else:
            deadline_message = "No deadline provided; total duration is {:.1f} days.".format(plan.total_duration or 0.0)

        risk_score = 0
        if buffer_days is not None:
            if buffer_days < 0:
                risk_score += 2
            elif buffer_days < 3:
                risk_score += 1

        if total_tasks > 0:
            zero_slack_ratio = zero_slack_tasks / total_tasks
            if zero_slack_ratio > 0.4:
                risk_score += 2
            elif zero_slack_ratio > 0.2:
                risk_score += 1

        if len(high_risk_tasks) >= 3:
            risk_score += 1

        if progress_percentage < 30 and completed_tasks < total_tasks:
            risk_score += 1

        if risk_score >= 4:
            overall_risk = "High"
        elif risk_score >= 2:
            overall_risk = "Medium"
        else:
            overall_risk = "Low"

        recommendations: List[str] = []

        if buffer_days is not None:
            if buffer_days < 0:
                recommendations.append("Extend the deadline or remove scope; the plan exceeds the available time.")
            elif buffer_days < 3:
                recommendations.append("Add contingency or accelerate critical tasks to improve the schedule buffer.")
        else:
            recommendations.append("Set a deadline to track schedule risk and buffer more effectively.")

        if high_risk_tasks:
            focus_task = high_risk_tasks[0]
            recommendations.append(
                f"Prioritise '{focus_task['name']}' — slack is only {focus_task['slack']} days."
            )

        if zero_slack_tasks > 0:
            recommendations.append(
                "Introduce parallel workstreams or re-sequence tasks to reduce the number of zero-slack items."
            )

        if progress_percentage < 100:
            recommendations.append(
                "Review completed work weekly and update task statuses to keep the plan accurate."
            )

        return {
            "overall_risk": overall_risk,
            "progress_percentage": progress_percentage,
            "average_slack": average_slack,
            "zero_slack_tasks": zero_slack_tasks,
            "deadline_status": deadline_status,
            "deadline_message": deadline_message,
            "buffer_days": buffer_days,
            "critical_path": critical_path_names,
            "high_risk_tasks": high_risk_tasks,
            "recommendations": recommendations,
        }
