# API Examples

This document provides examples of how to interact with the Smart Task Planner API.

## Base URL

```
Local: http://localhost:8000
Production: https://your-app.render.com
```

## Authentication

Currently, the API does not require authentication (demo mode). For production, implement OAuth2 with JWT tokens.

## Endpoints

### 1. Create a Plan

Create a new project plan from a goal.

**Request:**
```http
POST /api/plan
Content-Type: application/json

{
  "goal": "Launch a new mobile app in 3 months",
  "deadline": "2025-04-01T00:00:00Z"
}
```

**Response:**
```json
{
  "id": 1,
  "goal": "Launch a new mobile app in 3 months",
  "created_at": "2025-01-08T10:30:00Z",
  "updated_at": "2025-01-08T10:30:00Z",
  "total_duration": 45.5,
  "deadline": "2025-04-01T00:00:00Z",
  "critical_path": [0, 2, 3, 4],
  "tasks": [
    {
      "id": 1,
      "plan_id": 1,
      "name": "Requirements Gathering",
      "description": "Define app features and user stories",
      "optimistic_duration": 3,
      "most_likely_duration": 5,
      "pessimistic_duration": 7,
      "expected_duration": 5.0,
      "dependencies": [],
      "earliest_start": 0,
      "earliest_finish": 5.0,
      "latest_start": 0,
      "latest_finish": 5.0,
      "slack": 0,
      "start_date": "2025-01-08T00:00:00Z",
      "end_date": "2025-01-13T00:00:00Z",
      "is_complete": false,
      "is_on_critical_path": true
    }
  ]
}
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/api/plan" \
  -H "Content-Type: application/json" \
  -d '{"goal": "Launch a new mobile app in 3 months", "deadline": "2025-04-01T00:00:00Z"}'
```

**Python:**
```python
import requests

response = requests.post(
    "http://localhost:8000/api/plan",
    json={
        "goal": "Launch a new mobile app in 3 months",
        "deadline": "2025-04-01T00:00:00Z"
    }
)
plan = response.json()
print(f"Plan ID: {plan['id']}, Duration: {plan['total_duration']} days")
```

### 2. List All Plans

Get a summary of all plans.

**Request:**
```http
GET /api/plans
```

**Response:**
```json
[
  {
    "id": 1,
    "goal": "Launch a new mobile app in 3 months",
    "created_at": "2025-01-08T10:30:00Z",
    "total_duration": 45.5,
    "deadline": "2025-04-01T00:00:00Z",
    "task_count": 8
  },
  {
    "id": 2,
    "goal": "Organize a tech conference",
    "created_at": "2025-01-07T14:20:00Z",
    "total_duration": 60.0,
    "deadline": null,
    "task_count": 12
  }
]
```

**cURL:**
```bash
curl "http://localhost:8000/api/plans"
```

### 3. Get Plan Details

Retrieve a specific plan with all tasks.

**Request:**
```http
GET /api/plan/1
```

**Response:**
```json
{
  "id": 1,
  "goal": "Launch a new mobile app in 3 months",
  "total_duration": 45.5,
  "tasks": [...],
  "critical_path": [0, 2, 3, 4]
}
```

**cURL:**
```bash
curl "http://localhost:8000/api/plan/1"
```

### 4. Update Plan

Update task details and recompute the schedule.

**Request:**
```http
PUT /api/plan/1/update
Content-Type: application/json

{
  "tasks": [
    {
      "name": "Requirements Gathering (Updated)",
      "optimistic_duration": 2,
      "most_likely_duration": 4,
      "pessimistic_duration": 6
    },
    {
      "dependencies": [0, 1]
    }
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "goal": "Launch a new mobile app in 3 months",
  "total_duration": 42.0,
  "tasks": [...],
  "critical_path": [0, 2, 3]
}
```

**cURL:**
```bash
curl -X PUT "http://localhost:8000/api/plan/1/update" \
  -H "Content-Type: application/json" \
  -d '{"tasks": [{"name": "Updated Task", "optimistic_duration": 2, "most_likely_duration": 4, "pessimistic_duration": 6}]}'
```

### 5. Refine Plan with Feedback

Use AI to refine the plan based on feedback.

**Request:**
```http
POST /api/plan/1/feedback
Content-Type: application/json

{
  "feedback": "Add more detail to the testing phase and include user acceptance testing"
}
```

**Response:**
```json
{
  "id": 1,
  "goal": "Launch a new mobile app in 3 months",
  "total_duration": 48.5,
  "tasks": [...],
  "critical_path": [0, 2, 3, 5, 6]
}
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/api/plan/1/feedback" \
  -H "Content-Type: application/json" \
  -d '{"feedback": "Add more detail to the testing phase"}'
```

### 6. Natural Language Update

Modify the plan using natural language instructions.

**Request:**
```http
POST /api/plan/1/natural-update
Content-Type: application/json

{
  "instruction": "Add a code review phase between development and testing"
}
```

**Response:**
```json
{
  "id": 1,
  "goal": "Launch a new mobile app in 3 months",
  "total_duration": 50.0,
  "tasks": [...],
  "critical_path": [0, 2, 3, 4, 5, 6]
}
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/api/plan/1/natural-update" \
  -H "Content-Type: application/json" \
  -d '{"instruction": "Add a code review phase between development and testing"}'
```

### 7. Delete Plan

Delete a plan and all associated tasks.

**Request:**
```http
DELETE /api/plan/1
```

**Response:**
```
204 No Content
```

**cURL:**
```bash
curl -X DELETE "http://localhost:8000/api/plan/1"
```

### 8. Check Ollama Health

Verify that the Ollama service is running and the model is available.

**Request:**
```http
GET /api/health/ollama
```

**Response:**
```json
{
  "status": "healthy",
  "ollama_host": "http://localhost:11434",
  "models_available": ["qwen2.5:1.5b", "llama2:7b"],
  "qwen_installed": true,
  "configured_model": "qwen2.5:1.5b"
}
```

**cURL:**
```bash
curl "http://localhost:8000/api/health/ollama"
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Task dependencies contain a cycle. Please check dependencies."
}
```

### 404 Not Found
```json
{
  "detail": "Plan 999 not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error creating plan: connection refused"
}
```

## Rate Limiting

Currently, there are no rate limits. For production:
- Implement rate limiting (e.g., 100 requests per hour per IP)
- Use Redis for distributed rate limiting
- Return `429 Too Many Requests` when limit exceeded

## Complete Python Example

```python
import requests
from datetime import datetime, timedelta

# Base URL
BASE_URL = "http://localhost:8000"

# 1. Create a plan
def create_plan(goal, deadline=None):
    response = requests.post(
        f"{BASE_URL}/api/plan",
        json={"goal": goal, "deadline": deadline}
    )
    return response.json()

# 2. List all plans
def list_plans():
    response = requests.get(f"{BASE_URL}/api/plans")
    return response.json()

# 3. Get plan details
def get_plan(plan_id):
    response = requests.get(f"{BASE_URL}/api/plan/{plan_id}")
    return response.json()

# 4. Update a task
def update_plan(plan_id, task_updates):
    response = requests.put(
        f"{BASE_URL}/api/plan/{plan_id}/update",
        json={"tasks": task_updates}
    )
    return response.json()

# 5. Refine with feedback
def refine_plan(plan_id, feedback):
    response = requests.post(
        f"{BASE_URL}/api/plan/{plan_id}/feedback",
        json={"feedback": feedback}
    )
    return response.json()

# 6. Natural language update
def nl_update(plan_id, instruction):
    response = requests.post(
        f"{BASE_URL}/api/plan/{plan_id}/natural-update",
        json={"instruction": instruction}
    )
    return response.json()

# Example usage
if __name__ == "__main__":
    # Create a plan
    deadline = (datetime.now() + timedelta(days=60)).isoformat()
    plan = create_plan("Build an e-commerce website", deadline)
    print(f"Created plan #{plan['id']} with {len(plan['tasks'])} tasks")
    
    # List all plans
    plans = list_plans()
    print(f"Total plans: {len(plans)}")
    
    # Get plan details
    details = get_plan(plan['id'])
    print(f"Plan duration: {details['total_duration']} days")
    print(f"Critical path: {details['critical_path']}")
    
    # Update first task
    updated = update_plan(plan['id'], [
        {"name": "Updated Requirements", "most_likely_duration": 3}
    ])
    print(f"Updated duration: {updated['total_duration']} days")
    
    # Refine with feedback
    refined = refine_plan(plan['id'], "Add security testing phase")
    print(f"Refined plan has {len(refined['tasks'])} tasks")
    
    # Natural language update
    modified = nl_update(plan['id'], "Add buffer time before launch")
    print(f"Modified duration: {modified['total_duration']} days")
```

## Complete JavaScript Example

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Create a plan
async function createPlan(goal, deadline = null) {
  const response = await axios.post(`${BASE_URL}/api/plan`, {
    goal,
    deadline
  });
  return response.data;
}

// List all plans
async function listPlans() {
  const response = await axios.get(`${BASE_URL}/api/plans`);
  return response.data;
}

// Get plan details
async function getPlan(planId) {
  const response = await axios.get(`${BASE_URL}/api/plan/${planId}`);
  return response.data;
}

// Update plan
async function updatePlan(planId, taskUpdates) {
  const response = await axios.put(
    `${BASE_URL}/api/plan/${planId}/update`,
    { tasks: taskUpdates }
  );
  return response.data;
}

// Refine with feedback
async function refinePlan(planId, feedback) {
  const response = await axios.post(
    `${BASE_URL}/api/plan/${planId}/feedback`,
    { feedback }
  );
  return response.data;
}

// Natural language update
async function nlUpdate(planId, instruction) {
  const response = await axios.post(
    `${BASE_URL}/api/plan/${planId}/natural-update`,
    { instruction }
  );
  return response.data;
}

// Example usage
(async () => {
  try {
    // Create a plan
    const plan = await createPlan('Launch a SaaS product', '2025-06-01T00:00:00Z');
    console.log(`Created plan #${plan.id} with ${plan.tasks.length} tasks`);
    
    // List all plans
    const plans = await listPlans();
    console.log(`Total plans: ${plans.length}`);
    
    // Get plan details
    const details = await getPlan(plan.id);
    console.log(`Plan duration: ${details.total_duration} days`);
    
    // Update first task
    const updated = await updatePlan(plan.id, [
      { name: 'Updated Task', most_likely_duration: 5 }
    ]);
    console.log(`Updated duration: ${updated.total_duration} days`);
    
    // Refine with feedback
    const refined = await refinePlan(plan.id, 'Add user testing phase');
    console.log(`Refined plan has ${refined.tasks.length} tasks`);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
})();
```

## Interactive API Documentation

Visit `http://localhost:8000/docs` for interactive Swagger UI documentation where you can:
- Try out all endpoints
- See request/response schemas
- Generate code snippets
- Test with your own data

## Postman Collection

Import this JSON to Postman for quick testing:

```json
{
  "info": {
    "name": "Smart Task Planner API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Plan",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/plan",
        "body": {
          "mode": "raw",
          "raw": "{\"goal\": \"Launch a mobile app\", \"deadline\": \"2025-06-01T00:00:00Z\"}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    }
  ]
}
```
