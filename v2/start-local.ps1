<#
.SYNOPSIS
    Chronicle Ledger v2 - Start Local Development Environment
.DESCRIPTION
    Starts the Python FastAPI backend on port 8000 and the React Vite dev server on port 5173.
#>

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Chronicle Ledger v2 - Launching Local Dev Environment   " -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Start Python Backend
Write-Host "Starting Python FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn v2.backend.main:app --reload --port 8000" -PassThru

# 2. Start Frontend
Write-Host "Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Set-Location -Path "v2\frontend"
npm run dev
