# Smart Task Planner 

> AI-powered project planning with CPM/PERT scheduling - Turn your goals into actionable tasks with smart dependencies and timelines

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

##  Features

- **AI-Powered Task Generation**: Uses Google Generative AI (Gemini 2.0 Flash) to intelligently break down goals into actionable tasks
- **Critical Path Analysis**: Automatically identifies bottlenecks and critical tasks using CPM (Critical Path Method)
- **PERT Estimation**: Three-point estimates (optimistic, most likely, pessimistic) for realistic scheduling
- **Interactive Gantt Chart**: Beautiful visual timeline with task dependencies
- **Task Editing**: Inline editing of tasks with automatic schedule recomputation
- **Natural Language Updates**: Modify plans using simple instructions like "add a testing phase after development"
- **Reflective Planning**: AI-powered plan refinement based on user feedback
- **Progress Tracking**: Mark tasks complete and track project progress
- **Insight Engine**: Automatic deadline analysis, slack diagnostics and prioritized risk recommendations
- **One-Click Export**: Download the entire schedule as a CSV for sharing or reporting
- **Dependency Management**: Visual dependency graph with automatic cycle detection
- **Secure API Key Management**: API keys loaded from environment variables, never committed to version control

## Architecture

### Backend (FastAPI + Python)
- **FastAPI**: Modern, fast API framework with automatic OpenAPI documentation
- **Google Generative AI**: Cloud-based LLM (Gemini 2.0 Flash) for intelligent task generation
- **NetworkX**: Graph algorithms for CPM/PERT calculations and critical path analysis
- **SQLAlchemy**: ORM for database management (SQLite for demo, PostgreSQL-ready)
- **Pydantic**: Type-safe request/response validation

### Frontend (Next.js 14 + React)
- **Next.js 14**: React framework with SSR and optimized performance
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first styling for rapid UI development
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icon library
- **Axios**: HTTP client for API communication

## Prerequisites

Before you begin, ensure you have the following:

1. **Python 3.9+**
   ```bash
   python --version
   ```

2. **Node.js 18+** and **npm**
   ```bash
   node --version
   npm --version
   ```

3. **Google Generative AI API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create or sign in to your Google account
   - Click "Create API Key"
   - Copy the API key (starts with `AIza...`)
   - **Important**: Keep this key secure and never commit it to version control

## Quick Start

### 1. Clone the Repository

```bash
cd e:\Unthinkable\smart-task-planner
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Windows CMD:
.\venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API key
# Copy the example file and add your actual API key
echo "GOOGLE_GENAI_API_KEY=your_actual_api_key_here" > .env

# Start the backend server
uvicorn app.main:app --reload

# Server will start at http://localhost:8000
# API documentation available at http://localhost:8000/docs
```

**Important**: Replace `your_actual_api_key_here` with your actual Google API key from step 3 of Prerequisites.

### 3. Frontend Setup

Open a **new terminal** window:

```bash
# Navigate to frontend directory
cd e:\Unthinkable\smart-task-planner\frontend

# Install dependencies
npm install

# Start the development server
npm run dev

# Application will start at http://localhost:3000
```

### 4. Verify Setup

1. **Check Backend Health**:
   - Visit `http://localhost:8000` - should show API health status
   - Visit `http://localhost:8000/docs` - interactive API documentation
   - Visit `http://localhost:8000/api/health/genai` - verify Google AI connection

2. **Check Frontend**:
   - Visit `http://localhost:3000` - should show the Smart Task Planner interface

If you see any errors about the API key, make sure you've correctly set `GOOGLE_GENAI_API_KEY` in `backend/.env`.

## 📖 Usage

### Creating a Plan

1. Open your browser to `http://localhost:3000`
2. Enter your goal (e.g., "Launch a mobile app in 3 months")
3. Optionally set a deadline
4. Click "Generate Smart Plan"
5. The AI will create a task breakdown with dependencies and timelines

### Viewing and Editing

- **Gantt Chart**: Visual timeline showing task durations and dependencies
- **Critical Path**: Tasks highlighted in red are on the critical path (zero slack)
- **Task Editing**: Click the edit icon to modify task details
- **Mark Complete**: Click the checkbox to mark tasks as done
- **Progress Tracking**: See overall progress percentage

### Advanced Features

#### Natural Language Updates
```
"add a code review phase between development and testing"
"shorten the deployment task by 2 days"
"add buffer time before the deadline"
```

#### Refine with Feedback
Click "Refine Plan" and provide feedback:
```
"Add more detail to the testing phase"
"Break down development into smaller subtasks"
"Include documentation tasks"
```

## API Endpoints

### Plans

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plan` | POST | Create a new plan from a goal |
| `/api/plans` | GET | List all plans (summary) |
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plan` | POST | Create a new plan from a goal |
| `/api/plans` | GET | List all plans (summary) |
| `/api/plan/{id}` | GET | Get plan details |
| `/api/plan/{id}/insights` | GET | Get analytics and recommendations for a plan |
| `/api/plan/{id}/update` | PUT | Update plan with modified tasks |
| `/api/plan/{id}/feedback` | POST | Refine plan with feedback |
| `/api/plan/{id}/natural-update` | POST | Natural language update |
| `/api/plan/{id}` | DELETE | Delete a plan |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API health check |
| `/api/health/genai` | GET | Check Google Generative AI service status |

Full API documentation: `http://localhost:8000/docs`

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_scheduling.py -v
```

### Test Coverage

The test suite includes:
- ✅ Sequential task scheduling
- ✅ Parallel task dependencies
- ✅ PERT duration calculations
- ✅ Critical path identification
- ✅ Slack computation
- ✅ Calendar date assignment
- ✅ Circular dependency detection
- ✅ Edge cases (empty tasks, invalid dependencies)

## Project Structure

```
smart-task-planner/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── database.py          # Database configuration
│   │   └── services.py          # Business logic (LLM, scheduling)
│   ├── tests/
│   │   └── test_scheduling.py   # Unit tests
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── components/
│   │   ├── GanttChart.tsx       # Gantt chart visualization
│   │   ├── TaskEditor.tsx       # Task editing modal
│   │   └── FeedbackModal.tsx    # Feedback/refinement modal
│   ├── lib/
│   │   └── api.ts               # API client
│   ├── pages/
│   │   ├── _app.tsx             # App wrapper
│   │   ├── _document.tsx        # Document structure
│   │   ├── index.tsx            # Home page
│   │   └── plan/
│   │       └── [id].tsx         # Plan detail page
│   ├── styles/
│   │   └── globals.css          # Global styles
│   ├── next.config.js           # Next.js configuration
│   ├── tailwind.config.js       # Tailwind configuration
│   ├── tsconfig.json            # TypeScript configuration
│   └── package.json             # Node dependencies
└── README.md                    # This file
```

## Configuration

### Environment Variables

#### Backend (`backend/.env`)
```env
# Required: Your Google Generative AI API key
GOOGLE_GENAI_API_KEY=your_api_key_here
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Changing the AI Model

The project uses Google's Gemini 2.0 Flash model by default. To use a different Gemini model, edit `backend/app/services.py`:

```python
# In GoogleGenAIService.__init__
self.model = genai.GenerativeModel('gemini-2.0-flash')  # Change to your preferred model
```

Available Gemini models:
- `gemini-2.0-flash` - Fast, efficient (recommended)
- `gemini-1.5-pro` - More powerful reasoning
- `gemini-1.5-flash` - Balanced performance

Check [Google AI documentation](https://ai.google.dev/models/gemini) for the latest models.

##  Deployment

### Backend (Render / Railway / Cloud Run)

1. Push code to GitHub
2. Connect repository to your hosting platform
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Add environment variable**: `GOOGLE_GENAI_API_KEY=<your-api-key>`
6. Deploy

### Frontend (Vercel / Netlify)

1. Push code to GitHub
2. Import project in Vercel/Netlify
3. Set root directory to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=<your-backend-url>`
5. Deploy

**Security Note**: Never commit your API keys. Always use environment variables and keep the `.env` file in `.gitignore`.

##  Screenshots & Features

### Home Page
- Clean, modern interface with gradient backgrounds
- Recent plans history
- Quick start with goal input

### Plan Detail Page
- Interactive Gantt chart with color-coded tasks
- Critical path highlighting
- Task statistics dashboard
- Natural language update interface
- Task completion tracking
- Real-time progress bar

### Task Editing
- PERT estimation (optimistic/most likely/pessimistic)
- Dependency selection with visual interface
- Automatic schedule recomputation
- Validation and error handling

## How It Works

### 1. Task Generation (LLM)
```
User Goal → Gemini LLM → Structured Task List
##  How It Works

### 1. Task Generation (AI-Powered)
```
User Goal → Google Gemini 2.0 Flash → Structured Task List
                                      (name, description, durations, dependencies)
```

The system uses sophisticated prompts to generate domain-specific, enterprise-ready tasks:
- **Primary Attempt**: Generates 6-12 tailored tasks based on goal keywords
- **Retry Logic**: Fallback with simplified prompt if first attempt fails
- **Dynamic Fallback**: Heuristic-based task generation for pharma, SaaS, marketing, or general projects

### 2. Schedule Computation (CPM/PERT)
```
Tasks → Build DAG → Topological Sort → Forward Pass (ES, EF)
                                    → Backward Pass (LS, LF)
                                    → Calculate Slack
                                    → Identify Critical Path
```

Using NetworkX graph algorithms:
- **Forward Pass**: Calculate earliest start/finish times
- **Backward Pass**: Calculate latest start/finish times
- **Slack Analysis**: Identify buffer time for each task
- **Critical Path**: Find tasks with zero slack (project bottlenecks)

### 3. PERT Formula
```
Expected Duration (TE) = (Optimistic + 4 × Most Likely + Pessimistic) / 6
Slack = Latest Start - Earliest Start
Critical Path = Tasks with Slack = 0
```

### 4. Insight Engine
The system automatically analyzes:
- **Risk Assessment**: High/Medium/Low based on buffer, slack, and progress
- **Deadline Status**: On track / At risk / Behind schedule
- **Recommendations**: Prioritized actions to improve schedule health
- **High-Risk Tasks**: Tasks with minimal slack that need attention

### 5. Complete Workflow
```
┌─────────────────────────────────────────────────────────────────┐
    User Input: Goal + Optional Deadline                          
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
   • Google Gemini API: Generate Domain-Specific Tasks             
   • Primary prompt with enterprise terminology                   
   • Retry with simplified prompt if needed                       
   • Dynamic fallback (pharma/SaaS/marketing/general)            
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
   •Task Parsing & Validation                                      
   • JSON extraction from AI response                             
   • Validate PERT estimates (optimistic/likely/pessimistic)     
   • Verify dependencies (no cycles, valid indices)              
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
   • Schedule Computation (NetworkX + CPM/PERT)                     
   • Build directed acyclic graph (DAG)                           
   • Calculate expected durations (PERT formula)                  
   • Forward pass: earliest start/finish times                    
   • Backward pass: latest start/finish times                     
   • Calculate slack for each task                                
   • Identify critical path (longest path)                        
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
   •Database Storage (SQLAlchemy + SQLite)                         
   • Save plan with metadata                                      
   • Store tasks with scheduling data                             
   • Persist critical path and total duration                     
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
   • Frontend Display (Next.js)                                     
   • Interactive Gantt chart visualization                        
   • Task cards with edit/complete actions                        
   • Critical path highlighting (red)                             
   • Progress tracking and insights dashboard                     
└─────────────────────────────────────────────────────────────────┘
```

##  Tips & Best Practices

1. **Be Specific with Goals**: "Launch a mobile app with user authentication and payment in 3 months" works better than "make an app"

2. **Use Natural Language Updates**: The AI understands context, so you can say "add testing after development" instead of manually editing dependencies

3. **Check Critical Path**: Focus on tasks highlighted in red - they directly impact your deadline

4. **Adjust Estimates**: Use the task editor to fine-tune optimistic/pessimistic estimates based on your experience

5. **Track Progress**: Mark tasks complete to visualize progress and motivate your team

##  Troubleshooting

### "Failed to create plan" or "Google Generative AI error"
- **Check API Key**: Ensure `GOOGLE_GENAI_API_KEY` is correctly set in `backend/.env`
- **Verify API Key**: Visit `http://localhost:8000/api/health/genai` to test the connection
- **Check Quota**: Ensure your Google AI API has available quota/credits
- **Backend Logs**: Check terminal for detailed error messages
- **Fallback**: The system automatically generates a basic plan if AI fails

### "API Key Error" on Startup
- Make sure `.env` file exists in the `backend/` directory
- Verify the API key format (should start with `AIza...`)
- Get a new key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### TypeScript Errors in Frontend
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and restart: `rm -rf .next && npm run dev`

### Port Already in Use
- Backend: Change port with `uvicorn app.main:app --port 8001`
- Frontend: Change port with `npm run dev -- -p 3001`

### CORS Errors
- Ensure backend is running on `http://localhost:8000`
- Check `frontend/.env.local` has correct `NEXT_PUBLIC_API_URL`

##  Contributing

This project was created as a submission for Unthinkable. If you'd like to extend it:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

##  License

This project is created for educational and demonstration purposes.

##  Acknowledgments

- **Google AI**: For providing the powerful Gemini models via Generative AI API
- **FastAPI**: For the excellent Python web framework
- **Next.js Team**: For the outstanding React framework
- **NetworkX**: For robust graph algorithms powering CPM/PERT calculations
- **Unthinkable**: For the opportunity to build this innovative project

##  Contact

Built with ❤️ for Unthinkable

---

**Note**: This is a demonstration project showcasing AI-powered project planning with enterprise-grade scheduling algorithms. For production use, consider:
- Adding user authentication and authorization
- Implementing team collaboration features
- Using PostgreSQL or MySQL for production database
- Adding file export (PDF, MS Project, Excel, iCal)
- Implementing WebSocket for real-time updates
- Adding mobile responsiveness improvements
- Setting up rate limiting and API key rotation
- Implementing comprehensive logging and monitoring
- Adding backup and disaster recovery
