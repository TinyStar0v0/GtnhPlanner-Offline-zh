@echo off
chcp 65001 >nul
rem GTNH Planner (Chinese, personal build). Double-click to start.
rem Serves http://127.0.0.1:3100 and opens the browser. Keep this window open;
rem closing it stops the site (Ctrl+C also stops it).
setlocal
cd /d "%~dp0"
set "TMP=%~dp0.tmp"
set "TEMP=%~dp0.tmp"
if not exist "%TMP%" mkdir "%TMP%" >nul 2>&1

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Node.js not found. Install Node.js 18+ and add it to PATH, then run this again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   First run: installing dependencies, this needs the network...
  call npm install --no-audit --no-fund --ignore-scripts
  if errorlevel 1 (
    echo.
    echo   npm install failed. See the errors above.
    pause
    exit /b 1
  )
)

if not exist "public\datasets\gtnh\datasets.manifest.json" (
  echo.
  echo   The recipe dataset is missing. Run setup.cmd first ^(one time, needs network^).
  echo.
  pause
  exit /b 1
)

node scripts\serve.mjs dev 3100 %*
if errorlevel 1 (
  echo.
  echo   Start failed. See the errors above.
  pause
)
