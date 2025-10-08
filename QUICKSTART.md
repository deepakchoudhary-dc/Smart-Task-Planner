# 🚀 Quick Start Guide

This guide will help you get the Smart Task Planner running in just a few minutes.

## Step 1: Install Ollama & Download Model (5 minutes)

### Windows
1. Download Ollama from https://ollama.ai/download/windows
2. Run the installer
3. Open PowerShell and verify installation:
   ```powershell
   ollama --version
   ```
4. Pull the Qwen3 model (this will download ~1GB):
   ```powershell
   ollama pull qwen2.5:1.5b
   ```
5. Verify the model is installed:
   ```powershell
   ollama list
   ```

You should see `qwen2.5:1.5b` in the list.

## Step 2: Start the Backend (2 minutes)

1. Open PowerShell and navigate to the backend folder:
   ```powershell
   cd e:\Unthinkable\smart-task-planner\backend
   ```

2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   
   If you get an execution policy error, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Start the server:
   ```powershell
   uvicorn app.main:app --reload
   ```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
✓ Database initialized
✓ Ollama service configured at http://localhost:11434
```

**Keep this terminal open!**

## Step 3: Start the Frontend (2 minutes)

1. Open a **NEW** PowerShell window
2. Navigate to the frontend folder:
   ```powershell
   cd e:\Unthinkable\smart-task-planner\frontend
   ```

3. Install dependencies (this may take 2-3 minutes):
   ```powershell
   npm install
   ```

4. Start the development server:
   ```powershell
   npm run dev
   ```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Keep this terminal open too!**

## Step 4: Open the Application (30 seconds)

1. Open your browser to: **http://localhost:3000**
2. You should see the Smart Task Planner home page with:
   - ✓ AI Ready (green badge in top right)
   - A goal input form
   - Recent plans section (empty for now)

## Step 5: Create Your First Plan (1 minute)

1. In the goal input box, type:
   ```
   Launch a new e-commerce website in 6 weeks
   ```

2. Click **"Generate Smart Plan"**

3. Wait 10-30 seconds while the AI generates tasks...

4. You'll be redirected to your plan with:
   - **Task breakdown** (5-10 tasks)
   - **Gantt chart** visualization
   - **Critical path** highlighted in red
   - **Duration estimates** and dependencies

## 🎉 Success!

You now have a working Smart Task Planner! Try these next:

### ✏️ Edit a Task
- Click the edit icon on any task
- Modify durations or dependencies
- Click Save - schedule updates automatically

### 💬 Natural Language Update
- In the purple box, type: `"add a user testing phase after development"`
- Click Apply
- Watch the AI modify your plan

### 🔄 Refine with Feedback
- Click "Refine Plan" button
- Type: `"Add more detail to the testing phase"`
- The AI will regenerate the plan with improvements

## 📊 What You're Seeing

### Colors
- 🔴 **Red tasks**: Critical path (zero slack, delays affect deadline)
- 🔵 **Blue tasks**: Normal tasks (have some slack time)
- 🟢 **Green tasks**: Completed tasks

### Key Metrics
- **Duration**: Total project length in days
- **Tasks**: Number of tasks in the plan
- **Critical Path**: Number of tasks on the critical path
- **Progress**: Percentage of completed tasks

## 🐛 Common Issues

### "Ollama not detected" warning
- Make sure Ollama is running (it should auto-start)
- Try opening a new terminal and run: `ollama list`
- If that fails, restart Ollama from Start Menu

### Backend won't start
- Make sure virtual environment is activated (you should see `(venv)` in prompt)
- Try: `python -m pip install --upgrade pip`
- Then: `pip install -r requirements.txt` again

### Frontend errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Make sure you're using Node.js 18+: `node --version`

### "Module not found" errors
- Backend: Make sure you're in the backend folder when running uvicorn
- Frontend: Make sure you're in the frontend folder when running npm

### Plan generation is slow
- First request can take 10-30 seconds (loading model)
- Subsequent requests are faster (5-10 seconds)
- Smaller models are faster: `ollama pull qwen2.5:0.5b`

## 📚 Next Steps

1. **Explore the API**: Visit http://localhost:8000/docs for interactive API documentation
2. **Run Tests**: `cd backend && pytest` to run the test suite
3. **Customize**: Edit the prompt in `backend/app/services.py` to change how tasks are generated
4. **Deploy**: See the README for deployment instructions to Vercel and Render

## 💡 Pro Tips

1. **Specific Goals Work Better**: Instead of "build an app", try "build an iOS app with user login, profile management, and push notifications"

2. **Use Deadlines**: Setting a deadline helps the AI understand urgency and create more realistic timelines

3. **Natural Language is Powerful**: You can say things like:
   - "add buffer time before launch"
   - "break development into 3 subtasks"
   - "make testing parallel with documentation"

4. **Check Slack Times**: Tasks with high slack (5+ days) can be delayed without affecting the project deadline

5. **Mark Progress**: As you complete tasks, check them off to track progress and motivate your team

## 🎯 Example Goals to Try

- "Plan a wedding for 150 guests in 4 months"
- "Launch a SaaS product with payment integration in 10 weeks"
- "Organize a tech conference for 500 attendees"
- "Develop and deploy a mobile game to app stores"
- "Complete a kitchen renovation in 8 weeks"
- "Write and publish a technical book in 6 months"

Happy Planning! 🚀
