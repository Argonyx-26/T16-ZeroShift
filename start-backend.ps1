<#
.SYNOPSIS
    Starts all Argonyx backend services locally (no Docker required).
    Assumes PostgreSQL is already running on localhost:5432.
.DESCRIPTION
    1. Creates the 'statmodels' database if it doesn't exist
    2. Applies the unified schema (auth + stat-models tables)
    3. Seeds demo data
    4. Installs auth-service npm deps if needed
    5. Starts the auth-service (port 4000)
    6. Starts the statmodels-api (port 8000)
.NOTES
    Stop all services with Ctrl+C.
#>

$ErrorActionPreference = 'Stop'
$ROOT = $PSScriptRoot

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Argonyx Backend Startup' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

# ─── Step 1: PostgreSQL database ───────────────────────────────────
Write-Host '[1/6] Ensuring PostgreSQL database exists...' -ForegroundColor Yellow
$dbExists = psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'statmodels'" 2>$null
if ($dbExists -match '1') {
    Write-Host '      Database "statmodels" already exists.' -ForegroundColor Green
} else {
    Write-Host '      Creating database "statmodels"...' -ForegroundColor Yellow
    psql -U postgres -c 'CREATE DATABASE statmodels'
    Write-Host '      Created.' -ForegroundColor Green
}

# ─── Step 2: Apply schema ──────────────────────────────────────────
Write-Host '[2/6] Applying unified schema...' -ForegroundColor Yellow
psql -U postgres -d statmodels -f "$ROOT\statmodels-postgres\db\schema.sql"
Write-Host '      Schema applied.' -ForegroundColor Green

# ─── Step 3: Seed demo data ───────────────────────────────────────
Write-Host '[3/6] Seeding demo data...' -ForegroundColor Yellow
$env:PYTHONPATH = "$ROOT\statmodels-postgres"
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/statmodels'
python "$ROOT\statmodels-postgres\scripts\seed.py"
Write-Host '      Seed complete.' -ForegroundColor Green

# ─── Step 4: npm install for auth-service ──────────────────────────
Write-Host '[4/6] Checking auth-service dependencies...' -ForegroundColor Yellow
if (-not (Test-Path "$ROOT\auth-service\node_modules")) {
    Write-Host '      Installing npm packages...' -ForegroundColor Yellow
    Push-Location "$ROOT\auth-service"
    npm install
    Pop-Location
}
Write-Host '      Dependencies ready.' -ForegroundColor Green

# ─── Step 5: Start auth-service ───────────────────────────────────
Write-Host '[5/6] Starting auth-service on port 4000...' -ForegroundColor Yellow
$authJob = Start-Job -ScriptBlock {
    Set-Location "$using:ROOT\auth-service"
    $env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/statmodels'
    $env:JWT_ACCESS_SECRET = 'dev-jwt-secret-change-in-prod'
    $env:JWT_REFRESH_SECRET = 'dev-refresh-secret-change-in-prod'
    $env:ACCESS_TOKEN_TTL = '1h'
    $env:REFRESH_TOKEN_TTL_DAYS = '7'
    $env:COOKIE_SECURE = 'false'
    $env:FRONTEND_URL = 'http://localhost:5173'
    $env:PORT = '4000'
    node src/server.js
}
Write-Host "      auth-service started (job $($authJob.Id))" -ForegroundColor Green

# ─── Step 6: Start statmodels API ──────────────────────────────────
Write-Host '[6/6] Starting statmodels-api on port 8000...' -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    Set-Location "$using:ROOT\statmodels-postgres"
    $env:PYTHONPATH = "$using:ROOT\statmodels-postgres"
    $env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/statmodels'
    $env:JWT_ACCESS_SECRET = 'dev-jwt-secret-change-in-prod'
    $env:REQUIRE_AUTH = 'false'
    $env:FRONTEND_ORIGINS = '*'
    uvicorn app.main:app --host 0.0.0.0 --port 8000
}
Write-Host "      statmodels-api started (job $($apiJob.Id))" -ForegroundColor Green

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  All services running!' -ForegroundColor Green
Write-Host '' -NoNewline
Write-Host '  Auth service:     ' -NoNewline -ForegroundColor DarkGray
Write-Host 'http://localhost:4000' -ForegroundColor White
Write-Host '  Stat models API:  ' -NoNewline -ForegroundColor DarkGray
Write-Host 'http://localhost:8000' -ForegroundColor White
Write-Host '  Swagger docs:     ' -NoNewline -ForegroundColor DarkGray
Write-Host 'http://localhost:8000/docs' -ForegroundColor White
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Press Ctrl+C to stop all services.' -ForegroundColor DarkGray
Write-Host ''

try {
    while ($true) {
        Start-Sleep -Seconds 5
        # Surface background job output/errors
        Receive-Job $authJob -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "[auth] $_" -ForegroundColor DarkCyan }
        Receive-Job $apiJob  -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "[api]  $_" -ForegroundColor DarkMagenta }
    }
} finally {
    Write-Host ''
    Write-Host 'Stopping services...' -ForegroundColor Yellow
    Stop-Job $authJob, $apiJob -ErrorAction SilentlyContinue
    Remove-Job $authJob, $apiJob -Force -ErrorAction SilentlyContinue
    Write-Host 'All services stopped.' -ForegroundColor Green
}
