# Smart Task Planner 🎯

> AI-powered project planning with CPM/PERT scheduling - Turn your goals into actionable tasks with smart dependencies and timelines

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## ✨ Features

- **🤖 AI-Powered Task Generation**: Uses local Qwen3 LLM via Ollama to break down goals into actionable tasks
- **📊 Critical Path Analysis**: Automatically identifies bottlenecks and critical tasks using CPM (Critical Path Method)
- **⏱️ PERT Estimation**: Three-point estimates (optimistic, most likely, pessimistic) for realistic scheduling
- **🎨 Interactive Gantt Chart**: Beautiful visual timeline with task dependencies
- **✏️ Task Editing**: Inline editing of tasks with automatic schedule recomputation
- **💬 Natural Language Updates**: Modify plans using simple instructions like "add a testing phase after development"
- **🔄 Reflective Planning**: AI-powered plan refinement based on user feedback
- **📈 Progress Tracking**: Mark tasks complete and track project progress
- **🧠 Insight Engine**: Automatic deadline analysis, slack diagnostics and prioritized risk recommendations
- **📥 One-Click Export**: Download the entire schedule as a CSV for sharing or reporting
- **🎯 Dependency Management**: Visual dependency graph with automatic cycle detection
- **🔒 Privacy-First**: All AI processing happens locally - no data leaves your machine

## 🏗️ Architecture

### Backend (FastAPI + Python)
- **FastAPI**: Modern, fast API framework with automatic OpenAPI documentation
- **NetworkX**: Graph algorithms for CPM/PERT calculations and critical path analysis
- **SQLAlchemy**: ORM for database management (SQLite for demo, PostgreSQL-ready)
- **Ollama API**: Local LLM integration for task generation
- **Pydantic**: Type-safe request/response validation

### Frontend (Next.js 14 + React)
- **Next.js 14**: React framework with SSR and optimized performance
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first styling for rapid UI development
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icon library
- **Axios**: HTTP client for API communication

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Python 3.9+**
   ```bash
   python --version
   ```

2. **Node.js 18+** and **npm**
   ```bash
   node --version
   npm --version
   ```

3. **Ollama** (for local AI)
   - Download from [ollama.ai](https://ollama.ai/)
   - Install and start the Ollama service
   - Pull the Qwen3 model:
     ```bash
     ollama pull qwen2.5:1.5b
     ```

## 🚀 Quick Start

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

# Start the backend server
uvicorn app.main:app --reload

# Server will start at http://localhost:8000
# API documentation available at http://localhost:8000/docs
```

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

### 4. Verify Ollama is Running

```bash
# Check Ollama status
ollama list

# Should show qwen2.5:1.5b model
```

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

## 🎯 API Endpoints

### Plans

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plan` | POST | Create a new plan from a goal |
| `/api/plans` | GET | List all plans (summary) |
| `/api/plan/{id}` | GET | Get plan details |
| `/api/plan/{id}/update` | PUT | Update plan with modified tasks |
| `/api/plan/{id}/feedback` | POST | Refine plan with feedback |
| `/api/plan/{id}/natural-update` | POST | Natural language update |
| `/api/plan/{id}` | DELETE | Delete a plan |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API health check |
| `/api/health/ollama` | GET | Check Ollama service status |

Full API documentation: `http://localhost:8000/docs`

## 🧪 Testing

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

## 📁 Project Structure

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

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)
```env
DATABASE_URL=sqlite:///./smart_task_planner.db
OLLAMA_HOST=http://localhost:11434
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Changing the LLM Model

Edit `backend/app/services.py`:
```python
self.model = "qwen2.5:1.5b"  # Change to your preferred model
```

Available Qwen models:
- `qwen2.5:0.5b` - Fastest, smallest
- `qwen2.5:1.5b` - Recommended balance
- `qwen2.5:3b` - Better quality
- `qwen2.5:7b` - Best quality (requires more RAM)

## 🚀 Deployment

### Backend (Render / Railway)

1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=<your-backend-url>`
5. Deploy

**Note**: For production deployment with Ollama, you'll need a server with Ollama installed or use a cloud-based LLM API (OpenAI, Anthropic, etc.) by modifying the `services.py` file.

## 🎨 Screenshots & Features

### Home Page
- Clean, modern interface with gradient backgrounds
- Real-time Ollama health check
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

## 🧠 How It Works

### 1. Task Generation (LLM)
```
User Goal → Qwen3 LLM → Structured Task List
                         (name, description, durations, dependencies)
```

### 2. Schedule Computation (CPM/PERT)
```
Tasks → Build DAG → Topological Sort → Forward Pass (ES, EF)
                                    → Backward Pass (LS, LF)
                                    → Calculate Slack
                                    → Identify Critical Path
```

### 3. PERT Formula
```
Expected Duration (TE) = (Optimistic + 4 × Most Likely + Pessimistic) / 6
Slack = Latest Start - Earliest Start
Critical Path = Tasks with Slack = 0
```

## 💡 Tips & Best Practices

1. **Be Specific with Goals**: "Launch a mobile app with user authentication and payment in 3 months" works better than "make an app"

2. **Use Natural Language Updates**: The AI understands context, so you can say "add testing after development" instead of manually editing dependencies

3. **Check Critical Path**: Focus on tasks highlighted in red - they directly impact your deadline

4. **Adjust Estimates**: Use the task editor to fine-tune optimistic/pessimistic estimates based on your experience

5. **Track Progress**: Mark tasks complete to visualize progress and motivate your team

## 🐛 Troubleshooting

### "Ollama not detected"
- Ensure Ollama is installed and running: `ollama list`
- Check the service is accessible: `curl http://localhost:11434/api/tags`
- Pull the required model: `ollama pull qwen2.5:1.5b`

### "Failed to create plan"
- Check backend logs in the terminal
- Verify Ollama is responding (sometimes first request is slow)
- Try the fallback by waiting - it auto-generates a basic plan

### TypeScript Errors in Frontend
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and restart: `rm -rf .next && npm run dev`

### Port Already in Use
- Backend: Change port with `uvicorn app.main:app --port 8001`
- Frontend: Change port with `npm run dev -- -p 3001`

## 🤝 Contributing

This project was created as a submission for Unthinkable. If you'd like to extend it:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📜 License

This project is created for educational and demonstration purposes.

## 🙏 Acknowledgments

- **Qwen Team**: For the excellent open-source LLM
- **Ollama**: For making local AI accessible
- **FastAPI**: For the amazing Python framework
- **Next.js Team**: For the best React framework
- **NetworkX**: For graph algorithms
- **Unthinkable**: For the opportunity to build this project

## 📧 Contact

Built with ❤️ for Unthinkable

---

**Note**: This is a demonstration project showcasing AI-powered project planning. For production use, consider:
- Adding user authentication
- Implementing team collaboration features
- Using PostgreSQL for production database
- Adding file export (PDF, MS Project, iCal)
- Implementing WebSocket for real-time updates
- Adding mobile responsiveness improvements
- Cloud LLM fallback for better reliability
