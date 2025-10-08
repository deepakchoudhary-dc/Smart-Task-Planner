# Smart Task Planner - Automated Setup Script for Windows
# This script automates the installation and setup process

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Smart Task Planner - Setup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Python installation
Write-Host "[1/6] Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python not found! Please install Python 3.9+ from python.org" -ForegroundColor Red
    exit 1
}

# Check Node.js installation
Write-Host "[2/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found! Please install Node.js 18+ from nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Ollama installation
Write-Host "[3/6] Checking Ollama..." -ForegroundColor Yellow
try {
    $ollamaVersion = ollama --version 2>&1
    Write-Host "  ✓ Ollama found: $ollamaVersion" -ForegroundColor Green
    
    # Check if Qwen model is installed
    Write-Host "  Checking for Qwen2.5 model..." -ForegroundColor Yellow
    $ollamaModels = ollama list 2>&1
    if ($ollamaModels -match "qwen2.5") {
        Write-Host "  ✓ Qwen2.5 model found" -ForegroundColor Green
    } else {
        Write-Host "  ! Qwen2.5 model not found. Installing..." -ForegroundColor Yellow
        ollama pull qwen2.5:1.5b
        Write-Host "  ✓ Qwen2.5 model installed" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Ollama not found!" -ForegroundColor Red
    Write-Host "  Please install Ollama from https://ollama.ai/download/windows" -ForegroundColor Red
    exit 1
}

# Setup Backend
Write-Host "[4/6] Setting up Backend..." -ForegroundColor Yellow
Set-Location -Path "backend"

# Create virtual environment
if (Test-Path "venv") {
    Write-Host "  Virtual environment already exists" -ForegroundColor Gray
} else {
    Write-Host "  Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "  ✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment and install dependencies
Write-Host "  Installing Python dependencies..." -ForegroundColor Yellow
& ".\venv\Scripts\pip.exe" install -r requirements.txt --quiet
Write-Host "  ✓ Backend dependencies installed" -ForegroundColor Green

Set-Location -Path ".."

# Setup Frontend
Write-Host "[5/6] Setting up Frontend..." -ForegroundColor Yellow
Set-Location -Path "frontend"

if (Test-Path "node_modules") {
    Write-Host "  Node modules already installed" -ForegroundColor Gray
} else {
    Write-Host "  Installing Node.js dependencies (this may take a few minutes)..." -ForegroundColor Yellow
    npm install --silent
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
}

Set-Location -Path ".."

# Create environment files
Write-Host "[6/6] Creating environment files..." -ForegroundColor Yellow

$backendEnv = "DATABASE_URL=sqlite:///./smart_task_planner.db`nOLLAMA_HOST=http://localhost:11434"
$frontendEnv = "NEXT_PUBLIC_API_URL=http://localhost:8000"

if (-not (Test-Path "backend\.env")) {
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "  ✓ Backend .env created" -ForegroundColor Green
} else {
    Write-Host "  Backend .env already exists" -ForegroundColor Gray
}

if (-not (Test-Path "frontend\.env.local")) {
    $frontendEnv | Out-File -FilePath "frontend\.env.local" -Encoding UTF8
    Write-Host "  ✓ Frontend .env.local created" -ForegroundColor Green
} else {
    Write-Host "  Frontend .env.local already exists" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  Setup Complete! ✓" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Open a terminal and run:" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Gray
Write-Host "     .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "     uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Open another terminal and run:" -ForegroundColor White
Write-Host "     cd frontend" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Open your browser to:" -ForegroundColor White
Write-Host "     http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed instructions, see QUICKSTART.md" -ForegroundColor Yellow
Write-Host ""
