@echo off
rem Stop the local GTNH Planner (whatever listens on port 3100).
setlocal
set PORT=3100
if not "%~1"=="" set PORT=%~1

set FOUND=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  set FOUND=1
  taskkill /PID %%a /F >nul 2>&1
  if errorlevel 1 (
    powershell -NoProfile -Command "Stop-Process -Id %%a -Force" >nul 2>&1
  )
  echo   stopped PID %%a
)
if not defined FOUND echo   nothing is listening on port %PORT%.
