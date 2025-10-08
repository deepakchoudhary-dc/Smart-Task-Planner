# Troubleshooting Guide

Common issues and solutions for the Smart Task Planner.

## Table of Contents
- [Installation Issues](#installation-issues)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Ollama Issues](#ollama-issues)
- [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)

---

## Installation Issues

### Python not found
**Error:** `'python' is not recognized as an internal or external command`

**Solution:**
1. Download Python from https://python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Restart your terminal
4. Verify: `python --version`

### Node.js not found
**Error:** `'node' is not recognized as an internal or external command`

**Solution:**
1. Download Node.js from https://nodejs.org/
2. Install the LTS version (18.x or higher)
3. Restart your terminal
4. Verify: `node --version` and `npm --version`

### Permission denied on PowerShell
**Error:** `cannot be loaded because running scripts is disabled`

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Backend Issues

### Virtual environment activation fails
**Error:** `Activate.ps1 cannot be loaded`

**Solution:**
```powershell
# Use one of these alternatives:
.\venv\Scripts\Activate.ps1           # PowerShell
.\venv\Scripts\activate.bat           # CMD
source venv/Scripts/activate          # Git Bash
```

### ModuleNotFoundError: No module named 'app'
**Error:** When running uvicorn

**Solution:**
1. Make sure you're in the `backend` directory
2. Check that `app/__init__.py` exists
3. Verify virtual environment is activated: `(venv)` should appear in prompt
4. Reinstall dependencies: `pip install -r requirements.txt`

### Port 8000 already in use
**Error:** `[Errno 98] Address already in use`

**Solution:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
uvicorn app.main:app --port 8001
```

### Database locked error
**Error:** `database is locked`

**Solution:**
1. Close all other connections to the database
2. Delete `smart_task_planner.db` and restart (will lose data)
3. Or switch to PostgreSQL for production

### ImportError: cannot import name 'X'
**Error:** Import errors in Python

**Solution:**
```powershell
# Reinstall dependencies
pip uninstall -r requirements.txt -y
pip install -r requirements.txt

# Clear Python cache
Remove-Item -Recurse -Force __pycache__
Remove-Item -Recurse -Force app\__pycache__
```

---

## Frontend Issues

### npm install fails
**Error:** Various npm errors during installation

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install
```

### Cannot find module '@/lib/api'
**Error:** Module not found errors

**Solution:**
1. Check `tsconfig.json` has the correct paths configuration
2. Restart the dev server: `Ctrl+C` then `npm run dev`
3. Delete `.next` folder: `Remove-Item -Recurse -Force .next`

### Port 3000 already in use
**Error:** `Port 3000 is already in use`

**Solution:**
```powershell
# Use a different port
npm run dev -- -p 3001

# Or kill the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Type errors in VSCode
**Error:** Red squiggles everywhere

**Solution:**
1. Install dependencies: `npm install`
2. Restart VSCode: `Ctrl+Shift+P` → "Reload Window"
3. Check TypeScript version: `npx tsc --version`
4. The app will work despite TypeScript errors until dependencies are installed

### Next.js build fails
**Error:** Build errors

**Solution:**
```powershell
# Clear build cache
Remove-Item -Recurse -Force .next

# Rebuild
npm run build
```

---

## Ollama Issues

### Ollama not detected
**Error:** "⚠️ Ollama not detected" in UI

**Solution:**
1. Check if Ollama is running:
   ```powershell
   ollama list
   ```
2. If not installed, download from https://ollama.ai/
3. Start Ollama (should auto-start, but try):
   ```powershell
   ollama serve
   ```
4. Verify API is accessible:
   ```powershell
   curl http://localhost:11434/api/tags
   ```

### Model not found
**Error:** `model "qwen2.5:1.5b" not found`

**Solution:**
```powershell
# Pull the model
ollama pull qwen2.5:1.5b

# Verify it's installed
ollama list

# If slow, try smaller model
ollama pull qwen2.5:0.5b
```

### Ollama API timeout
**Error:** `Request timeout` when creating plans

**Solution:**
1. First request can be slow (10-30 seconds) as model loads
2. Increase timeout in `backend/app/services.py`:
   ```python
   timeout=180  # 3 minutes
   ```
3. Use a smaller model: `qwen2.5:0.5b`
4. Check system resources (RAM/CPU)

### Connection refused
**Error:** `Connection refused to localhost:11434`

**Solution:**
1. Restart Ollama:
   ```powershell
   # Find and kill Ollama process
   taskkill /IM ollama.exe /F
   
   # Restart from Start Menu or run
   ollama serve
   ```
2. Check firewall isn't blocking port 11434
3. Try changing host in `backend/.env`:
   ```
   OLLAMA_HOST=http://127.0.0.1:11434
   ```

---

## Database Issues

### No such table: plans
**Error:** `no such table: plans`

**Solution:**
```powershell
# Delete and recreate database
Remove-Item smart_task_planner.db
# Restart backend - tables will be created automatically
uvicorn app.main:app --reload
```

### Foreign key constraint failed
**Error:** Database constraint violations

**Solution:**
1. This shouldn't happen with cascade deletes, but if it does:
   ```powershell
   # Reset database
   Remove-Item smart_task_planner.db
   ```
2. Check your SQLAlchemy models have correct relationships

### Database file is encrypted
**Error:** If using an old SQLite file

**Solution:**
1. Delete the old database
2. Let the application create a new one
3. For production, use PostgreSQL

---

## Performance Issues

### Slow plan generation
**Symptom:** Takes 30+ seconds to create a plan

**Solutions:**
1. **Use a smaller model:**
   ```powershell
   ollama pull qwen2.5:0.5b
   ```
   Update `backend/app/services.py`:
   ```python
   self.model = "qwen2.5:0.5b"
   ```

2. **Check system resources:**
   - Open Task Manager
   - Look for high CPU/RAM usage
   - Close unnecessary applications

3. **Enable model preloading:**
   ```powershell
   # Keep model loaded in memory
   ollama run qwen2.5:1.5b ""
   ```

### Frontend is slow
**Symptom:** UI lags when viewing plans

**Solutions:**
1. **Production build:**
   ```powershell
   npm run build
   npm start
   ```
2. **Reduce task count** in large plans
3. **Enable React DevTools Profiler** to find bottlenecks

### High memory usage
**Symptom:** Application uses too much RAM

**Solutions:**
1. Use smaller Ollama model (0.5b instead of 1.5b)
2. Close browser tabs
3. Restart Ollama service
4. Consider using cloud LLM API instead

---

## Deployment Issues

### Backend won't start on Render
**Error:** Build or start failures

**Solutions:**
1. Check `requirements.txt` is in root of backend folder
2. Verify start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables in Render dashboard
4. Check logs for specific errors

### Frontend won't build on Vercel
**Error:** Build failures

**Solutions:**
1. Set root directory to `frontend` in Vercel settings
2. Add environment variable: `NEXT_PUBLIC_API_URL`
3. Check Node.js version matches `package.json`
4. Clear Vercel cache and redeploy

### CORS errors in production
**Error:** `CORS policy blocked`

**Solutions:**
1. Update `backend/app/main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://your-frontend.vercel.app"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
2. Ensure `NEXT_PUBLIC_API_URL` points to correct backend URL

### Ollama not available in production
**Issue:** Can't use local Ollama in cloud deployment

**Solutions:**
1. **Self-host backend with Ollama:**
   - Deploy to a VPS (DigitalOcean, AWS EC2)
   - Install Ollama on the server
   - Use Docker for easier deployment

2. **Switch to cloud LLM:**
   Modify `backend/app/services.py` to use OpenAI/Anthropic:
   ```python
   import openai
   
   def generate_tasks(self, goal):
       response = openai.ChatCompletion.create(
           model="gpt-3.5-turbo",
           messages=[{"role": "user", "content": prompt}]
       )
       # Parse response...
   ```

---

## Common Error Messages

### "Failed to create plan"
**Possible causes:**
- Ollama not running
- Model not loaded
- Network issues
- Invalid input

**Debug steps:**
1. Check backend logs in terminal
2. Test Ollama: `curl http://localhost:11434/api/tags`
3. Try with a simple goal: "Test project"
4. Check browser console for detailed error

### "Plan not found"
**Causes:**
- Plan was deleted
- Wrong plan ID in URL
- Database was reset

**Solution:**
- Go back to home page
- Create a new plan

### "Task dependencies contain a cycle"
**Cause:** Circular dependencies (A depends on B, B depends on A)

**Solution:**
- Review task dependencies
- Remove circular references
- Use task editor to fix dependencies

### "Network Error"
**Causes:**
- Backend not running
- Wrong API URL
- CORS issues

**Debug:**
1. Check backend is running: http://localhost:8000/
2. Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
3. Check browser console for details

---

## Getting Help

### Check Logs

**Backend logs:**
- Terminal where you ran `uvicorn app.main:app --reload`
- Look for stack traces and error messages

**Frontend logs:**
- Browser DevTools Console (F12)
- Terminal where you ran `npm run dev`

**Ollama logs:**
- Run `ollama logs` (if available)
- Check system event logs

### Enable Debug Mode

**Backend:**
```python
# In app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```javascript
// In lib/api.ts
console.log('Request:', url, data);
console.log('Response:', response);
```

### Collect System Info

When asking for help, provide:
```powershell
# System information
python --version
node --version
npm --version
ollama --version

# Backend status
curl http://localhost:8000/

# Ollama status
curl http://localhost:11434/api/tags

# Error messages (from terminal/console)
```

### Reset Everything

Nuclear option - start fresh:
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force venv
Remove-Item smart_task_planner.db
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend
cd ../frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
Remove-Item package-lock.json
npm install

# Ollama
ollama rm qwen2.5:1.5b
ollama pull qwen2.5:1.5b
```

---

## Still Having Issues?

1. **Check the README.md** for setup instructions
2. **Read QUICKSTART.md** for step-by-step guide
3. **Review ARCHITECTURE.md** for system design
4. **Check API_EXAMPLES.md** for API usage
5. **Search GitHub Issues** (if project is on GitHub)
6. **Create a new issue** with:
   - Error message
   - Steps to reproduce
   - System information
   - Logs from backend and frontend

---

**Last Updated:** 2025-01-08  
**Version:** 1.0.0
