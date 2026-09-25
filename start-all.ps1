# Argonyx - Full Stack Startup Script (PowerShell)
# Starts Auth Service (4000), Stat Models API (8000), and Frontend (5173)

$ROOT = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Argonyx Full Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Database : localhost:5433 (argonyx)" -ForegroundColor DarkGray
Write-Host "Auth Service        : http://localhost:4000" -ForegroundColor DarkGray
Write-Host "Stat Models API     : http://localhost:8000" -ForegroundColor DarkGray
Write-Host "Frontend App        : http://localhost:5173" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Auth Service in a new window
Write-Host "[1/3] Launching Auth Service (port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\auth-service'; `$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5433/argonyx'; node src/server.js"

# 2. Start Stat Models API in a new window
Write-Host "[2/3] Launching Stat Models API (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\statmodels-postgres'; `$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5433/argonyx'; py -3.12 -m uvicorn app.main:app --port 8000 --reload"

# 3. Start Frontend in a new window
Write-Host "[3/3] Launching Web Frontend (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\web'; npm run dev"

Start-Sleep -Seconds 2
Write-Host ""
Write-Host "All 3 services launched in separate windows!" -ForegroundColor Green
Write-Host "Open your browser at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
