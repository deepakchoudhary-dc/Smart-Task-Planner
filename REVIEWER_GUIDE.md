# Quick Start - For Reviewers

Welcome, Unthinkable reviewers! Here's the fastest way to see the Smart Task Planner in action.

## Prerequisites Check (2 minutes)

1. **Python 3.9+**: `python --version`
2. **Node.js 18+**: `node --version`
3. **Ollama**: Download from [ollama.ai](https://ollama.ai/)

## Installation (5 minutes)

### Option 1: Automated Setup (Recommended)

```powershell
# Run the setup script
.\setup.ps1

# Then follow on-screen instructions to start backend and frontend
```

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

**Terminal 3 - Ollama:**
```powershell
ollama pull qwen2.5:1.5b
# Ollama should auto-start, but if not: ollama serve
```

## Access the Application

Open your browser to: **http://localhost:3000**

You should see:
- ✓ AI Ready badge (green)
- Goal input form
- Example suggestions

## Try It Out (2 minutes)

1. **Create a Plan**:
   - Enter: `"Launch a new e-commerce website in 6 weeks"`
   - Click "Generate Smart Plan"
   - Wait 10-30 seconds (first time is slower)

2. **View the Results**:
   - See task breakdown (5-10 tasks)
   - Interactive Gantt chart
   - Critical path highlighted in red
   - Duration estimates

3. **Edit a Task**:
   - Click edit icon on any task
   - Modify durations
   - Watch schedule update automatically

4. **Natural Language Update**:
   - Type: `"add a security testing phase"`
   - Click Apply
   - See AI modify the plan

5. **Refine Plan**:
   - Click "Refine Plan"
   - Enter: `"Add more detail to testing"`
   - Watch AI improve the plan

## Key Features to Notice

✨ **AI-Powered**: Tasks generated from natural language  
📊 **Critical Path**: Red tasks are bottlenecks  
⏱️ **PERT Estimates**: Three-point duration estimates  
🔗 **Dependencies**: Automatic dependency management  
💬 **Natural Language**: Update plans with English  
📈 **Progress**: Mark tasks complete, see progress  

## API Documentation

Visit: **http://localhost:8000/docs** for interactive API documentation

## Example Goals to Try

- "Plan a wedding for 200 guests in 5 months"
- "Develop and launch a mobile game"
- "Organize a tech conference for 500 people"
- "Complete a kitchen renovation in 8 weeks"
- "Launch a SaaS product with payment integration"

## Troubleshooting

**"Ollama not detected"**:
```powershell
ollama list  # Should show qwen2.5:1.5b
ollama serve  # Start Ollama if not running
```

**Backend won't start**:
```powershell
cd backend
pip install -r requirements.txt
# Make sure venv is activated: (venv) should appear in prompt
```

**Frontend errors**:
```powershell
cd frontend
rm -rf node_modules .next
npm install
```

## What to Review

### Code Quality
- `backend/app/services.py` - AI integration & scheduling algorithms
- `backend/app/main.py` - API endpoints
- `frontend/pages/plan/[id].tsx` - Main UI component
- `frontend/components/GanttChart.tsx` - Chart visualization

### Documentation
- `README.md` - Complete overview
- `ARCHITECTURE.md` - Technical deep dive
- `PROJECT_SUMMARY.md` - Executive summary
- `TROUBLESHOOTING.md` - Common issues

### Tests
```powershell
cd backend
pytest -v
# Should see 10+ passing tests
```

## Architecture Overview

```
User Browser (Next.js)
    ↓ HTTP/REST
FastAPI Backend
    ↓ JSON API
Ollama (Qwen3 LLM)
    ↓ Task Generation
NetworkX (CPM/PERT)
    ↓ Schedule Computation
SQLite Database
```

## Key Technologies

- **Backend**: FastAPI, Python, NetworkX, SQLAlchemy
- **Frontend**: Next.js 14, React, TypeScript, Tailwind
- **AI**: Qwen3 via Ollama (local LLM)
- **Algorithms**: CPM, PERT, Graph Theory

## Metrics

- **Lines of Code**: 3,500+
- **Files**: 25+
- **Documentation**: 5,000+ lines
- **Tests**: 10+ unit tests
- **API Endpoints**: 8

## Questions?

See detailed guides:
- Setup issues → `TROUBLESHOOTING.md`
- API usage → `API_EXAMPLES.md`
- Technical details → `ARCHITECTURE.md`
- Step-by-step → `QUICKSTART.md`

---

**Estimated Review Time**: 30-60 minutes  
**Recommended Review Order**:
1. Run the application (5 min)
2. Create a few plans (10 min)
3. Review code highlights (15 min)
4. Read documentation (30 min)

**Thank you for your time!** 🙏
