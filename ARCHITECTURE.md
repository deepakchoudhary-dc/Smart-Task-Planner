# Smart Task Planner - Technical Architecture

## System Overview

The Smart Task Planner is a full-stack web application that combines AI-powered task generation with advanced project management algorithms (CPM/PERT) to create realistic, dependency-aware project plans.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   Next.js  │  │  React UI    │  │  Gantt Chart    │    │
│  │   Pages    │──│  Components  │──│  Visualization  │    │
│  └────────────┘  └──────────────┘  └─────────────────┘    │
│         │                                                    │
│         │ HTTP/REST API (Axios)                            │
│         ▼                                                    │
└─────────────────────────────────────────────────────────────┘
         │
         │
┌────────▼──────────────────────────────────────────────────┐
│                        Backend                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           FastAPI REST API Layer                     │ │
│  │  • Authentication (future)                           │ │
│  │  • Request validation (Pydantic)                     │ │
│  │  • Error handling                                    │ │
│  └──────────────────────────────────────────────────────┘ │
│         │                                                   │
│  ┌──────▼────────────┐        ┌─────────────────────┐    │
│  │  Services Layer   │        │  Database Layer     │    │
│  │                   │        │                     │    │
│  │  ┌─────────────┐ │        │  ┌──────────────┐  │    │
│  │  │   Ollama    │ │        │  │  SQLAlchemy  │  │    │
│  │  │   Service   │ │        │  │     ORM      │  │    │
│  │  └─────────────┘ │        │  └──────────────┘  │    │
│  │                   │        │         │          │    │
│  │  ┌─────────────┐ │        │         ▼          │    │
│  │  │ Scheduling  │ │        │  ┌──────────────┐  │    │
│  │  │  Service    │ │        │  │   SQLite /   │  │    │
│  │  │  (NetworkX) │ │        │  │  PostgreSQL  │  │    │
│  │  └─────────────┘ │        │  └──────────────┘  │    │
│  └──────────────────┘        └─────────────────────┘    │
│         │                                                  │
└─────────┼──────────────────────────────────────────────────┘
          │
          │ HTTP (JSON)
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ollama (Local LLM)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Qwen2.5 1.5B Model                      │  │
│  │  • Natural language understanding                    │  │
│  │  • Task generation from goals                        │  │
│  │  • Plan refinement with feedback                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Plan Creation Flow

```
User Input (Goal + Deadline)
    ↓
Frontend: Validate & Send to API
    ↓
Backend: POST /api/plan
    ↓
Ollama Service: Generate Tasks
    ↓ (Structured JSON: name, description, durations, dependencies)
Scheduling Service: Build Dependency Graph
    ↓
NetworkX: CPM/PERT Analysis
    ↓ (ES, EF, LS, LF, Slack, Critical Path)
Database: Persist Plan & Tasks
    ↓
Frontend: Display Gantt Chart & Tasks
```

### 2. Task Update Flow

```
User: Edit Task (durations/dependencies)
    ↓
Frontend: Collect Changes
    ↓
Backend: PUT /api/plan/{id}/update
    ↓
Database: Update Task Records
    ↓
Scheduling Service: Recompute Schedule
    ↓
NetworkX: Recalculate Critical Path
    ↓
Frontend: Refresh Display with New Schedule
```

### 3. Natural Language Update Flow

```
User: "add testing phase after development"
    ↓
Frontend: POST /api/plan/{id}/natural-update
    ↓
Ollama Service: Parse Instruction
    ↓ (Context: Current Plan + Instruction)
LLM: Generate Updated Task List
    ↓
Scheduling Service: Compute New Schedule
    ↓
Database: Replace Tasks
    ↓
Frontend: Display Updated Plan
```

## Core Algorithms

### CPM (Critical Path Method)

The Critical Path Method identifies the longest sequence of dependent tasks that determines the minimum project duration.

**Algorithm Steps:**

1. **Build DAG (Directed Acyclic Graph)**
   - Nodes = Tasks
   - Edges = Dependencies
   - Validate no cycles exist

2. **Forward Pass** (Calculate Earliest Times)
   ```python
   for task in topological_order:
       if task has no predecessors:
           ES[task] = 0
       else:
           ES[task] = max(EF[predecessor] for all predecessors)
       EF[task] = ES[task] + duration[task]
   ```

3. **Backward Pass** (Calculate Latest Times)
   ```python
   project_duration = max(EF[all tasks])
   
   for task in reverse_topological_order:
       if task has no successors:
           LF[task] = project_duration
       else:
           LF[task] = min(LS[successor] for all successors)
       LS[task] = LF[task] - duration[task]
   ```

4. **Calculate Slack & Critical Path**
   ```python
   Slack[task] = LS[task] - ES[task]
   Critical_Path = tasks where Slack == 0
   ```

### PERT (Program Evaluation and Review Technique)

PERT uses three-point estimation for more realistic duration predictions.

**Expected Duration Formula:**
```
TE = (O + 4M + P) / 6

Where:
  O = Optimistic estimate (best case)
  M = Most Likely estimate (normal case)
  P = Pessimistic estimate (worst case)
  TE = Expected Time
```

**Standard Deviation:**
```
σ = (P - O) / 6
```

**Implementation:**
```python
def calculate_expected_duration(task):
    return (
        task.optimistic_duration + 
        4 * task.most_likely_duration + 
        task.pessimistic_duration
    ) / 6.0
```

## Database Schema

### Tables

#### `plans`
```sql
CREATE TABLE plans (
    id INTEGER PRIMARY KEY,
    goal TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_duration FLOAT,
    deadline DATETIME NULL,
    critical_path JSON
);
```

#### `tasks`
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    plan_id INTEGER NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- PERT estimates
    optimistic_duration FLOAT NOT NULL,
    most_likely_duration FLOAT NOT NULL,
    pessimistic_duration FLOAT NOT NULL,
    expected_duration FLOAT,
    
    -- Scheduling results
    earliest_start FLOAT,
    earliest_finish FLOAT,
    latest_start FLOAT,
    latest_finish FLOAT,
    slack FLOAT,
    
    -- Calendar dates
    start_date DATETIME,
    end_date DATETIME,
    
    -- Dependencies & status
    dependencies JSON,
    is_complete INTEGER DEFAULT 0,
    is_on_critical_path INTEGER DEFAULT 0,
    
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);
```

## LLM Integration

### Prompt Engineering

The system uses carefully crafted prompts to ensure consistent JSON output from Qwen3:

```python
prompt = f"""You are a project planning expert. Break down the following goal into actionable tasks with PERT estimates.

Goal: {goal}

Return a JSON array of tasks. Each task must have:
- name: short task name
- description: brief description
- optimistic_duration: optimistic time estimate in days (best case)
- most_likely_duration: most likely time estimate in days
- pessimistic_duration: pessimistic time estimate in days (worst case)
- dependencies: array of task indices (0-based) that must be completed first

Example format:
[
  {{"name": "Task 1", "description": "...", "optimistic_duration": 1, 
    "most_likely_duration": 2, "pessimistic_duration": 3, "dependencies": []}},
  ...
]

Return ONLY the JSON array, no additional text.
"""
```

### Response Parsing

```python
1. Call Ollama API with prompt
2. Extract JSON from response (regex: r'\[.*\]')
3. Parse JSON and validate structure
4. Clean/sanitize task data
5. Fallback to default tasks if parsing fails
```

### Fallback Strategy

If LLM fails or produces invalid output, the system generates a 5-phase default plan:
1. Planning & Requirements
2. Design & Architecture
3. Development
4. Testing & QA
5. Deployment & Launch

## Frontend Architecture

### Component Hierarchy

```
App (_app.tsx)
├── Home (index.tsx)
│   └── Recent Plans List
│
└── Plan Detail ([id].tsx)
    ├── Stats Dashboard
    ├── Natural Language Input
    ├── GanttChart
    │   ├── Timeline Header
    │   └── Task Rows
    │       ├── Task Bar
    │       └── Dependencies
    ├── Task List
    │   └── Task Item
    │       ├── Checkbox (Complete)
    │       └── Edit Button
    ├── TaskEditor (Modal)
    │   ├── Name & Description
    │   ├── PERT Durations
    │   └── Dependency Selector
    ├── Insights Panel
    │   ├── Deadline Health
    │   ├── Slack & Risk Metrics
    │   └── Recommendations
    └── FeedbackModal
        ├── Feedback Input
        └── Quick Suggestions
```

The Plan Detail view also exposes:

- **Insights Panel** – fetches `/api/plan/{id}/insights` to surface deadline buffers, high-risk tasks and tailored recommendations derived from scheduling analytics.
- **CSV Export Utility** – serialises the current schedule to a spreadsheet-friendly format so reviewers can download and share the plan instantly.

### State Management

Uses React hooks for local state:
- `useState`: Component state
- `useEffect`: Data fetching & side effects
- `useRouter`: Navigation

### API Client Pattern

Centralized API client (`lib/api.ts`) provides:
- Type-safe request/response
- Error handling
- Axios interceptors
- Base URL configuration

## Performance Optimizations

### Backend
- **Async endpoints**: FastAPI async/await for concurrent requests
- **Database indexing**: Indexed `plan_id` and `id` columns
- **Connection pooling**: SQLAlchemy connection pool
- **Response caching**: Future enhancement using Redis

### Frontend
- **Code splitting**: Next.js automatic code splitting
- **Image optimization**: Next.js Image component
- **Lazy loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components

## Security Considerations

### Current Implementation (Demo)
- No authentication (single-user mode)
- Local-only deployment
- CORS open for development

### Production Recommendations
1. **Authentication**: OAuth2 with JWT tokens
2. **Rate limiting**: Prevent API abuse
3. **Input validation**: Sanitize all user input
4. **CORS**: Restrict to specific origins
5. **HTTPS**: Encrypt all traffic
6. **Database**: Use PostgreSQL with encryption
7. **Secrets management**: Environment variables

## Scalability

### Current Limits
- SQLite: ~1000 concurrent users
- Ollama: Limited by local GPU/CPU
- Single-server deployment

### Scaling Strategies

**Horizontal Scaling:**
- Load balancer → Multiple backend instances
- Shared PostgreSQL database
- Redis for session storage

**LLM Scaling:**
- Cloud LLM fallback (OpenAI, Anthropic)
- Request queuing with Celery
- Cached responses for common goals

**Database Scaling:**
- Read replicas for list operations
- Sharding by user_id
- Full-text search with Elasticsearch

## Testing Strategy

### Unit Tests (Backend)
- Scheduling algorithm correctness
- PERT calculations
- Dependency validation
- Edge cases (cycles, empty graphs)

### Integration Tests (Future)
- API endpoint testing
- Database operations
- LLM integration (mocked)

### E2E Tests (Future)
- Playwright for UI testing
- Full user workflows
- Cross-browser compatibility

## Monitoring & Observability

### Current
- Console logging
- FastAPI automatic docs

### Production Recommendations
1. **Logging**: Structured logging (JSON)
2. **Metrics**: Prometheus + Grafana
3. **Tracing**: OpenTelemetry
4. **Error tracking**: Sentry
5. **Uptime monitoring**: Better Uptime

## Future Enhancements

### Planned Features
1. **User Authentication**: Multi-user support
2. **Team Collaboration**: Shared plans, comments
3. **Advanced Risk Simulation**: Monte Carlo probability distributions
4. **Resource Management**: Assign team members
5. **Cost Estimation**: Budget tracking
6. **Templates**: Common project templates
7. **Mobile App**: React Native
8. **Real-time Updates**: WebSocket sync

### Technical Debt
- Add comprehensive error handling
- Implement request retry logic
- Add response caching
- Improve LLM prompt consistency
- Add database migrations (Alembic)
- Implement CI/CD pipeline
- Add performance benchmarks

## Development Workflow

```bash
# Start all services
1. Terminal 1: ollama serve (if not auto-started)
2. Terminal 2: cd backend && uvicorn app.main:app --reload
3. Terminal 3: cd frontend && npm run dev

# Run tests
cd backend && pytest -v

# Format code
cd backend && black app/
cd frontend && npx prettier --write .

# Type checking
cd frontend && npx tsc --noEmit
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│                  User Browser                    │
└──────────────────┬───────────────────────────────┘
                   │
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────────────┐
│              Vercel CDN Edge                     │
│         (Next.js Frontend - Static)              │
└──────────────────┬───────────────────────────────┘
                   │
                   │ API Calls
                   ▼
┌──────────────────────────────────────────────────┐
│           Render / Railway                       │
│       (FastAPI Backend Container)                │
│  ┌──────────────────────────────────────────┐   │
│  │  uvicorn app:main                        │   │
│  └──────────────────────────────────────────┘   │
└──────────────────┬───────────────────────────────┘
                   │
                   ├─────────────┬─────────────────┐
                   ▼             ▼                 ▼
         ┌─────────────┐  ┌────────────┐  ┌──────────┐
         │  PostgreSQL │  │   Ollama   │  │  Redis   │
         │  (Supabase) │  │  (Local)   │  │ (Future) │
         └─────────────┘  └────────────┘  └──────────┘
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: 2025-10-08  
**Author**: Smart Task Planner Team
