@echo off
chcp 65001 >nul
rem First run: install dependencies, then download the recipe dataset and icons.
rem Needs the network. About 400 MB total. Run this once, then use start.cmd.
setlocal
cd /d "%~dp0"
set "TMP=%~dp0.tmp"
set "TEMP=%~dp0.tmp"
if not exist "%TMP%" mkdir "%TMP%" >nul 2>&1

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Node.js not found. Install Node.js 18+ first: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if exist "node_modules" goto deps_ok
echo   [1/4] Installing dependencies...
call npm install --no-audit --no-fund --ignore-scripts
if errorlevel 1 (
  echo   npm install failed. See the errors above.
  pause
  exit /b 1
)
:deps_ok

echo   [2/4] Fetching the recipe dataset...
node scripts\fetch-dataset.mjs .
if errorlevel 1 goto fetch_fail

echo   [3/4] Fetching the 1112 recipe shards...
node scripts\fetch-shards.mjs .
if errorlevel 1 goto fetch_fail

echo   [4/4] Fetching item icons (about 57k files, this takes a while)...
node scripts\fetch-icons.mjs .
if errorlevel 1 goto fetch_fail

echo.
echo   Done. Now double-click start.cmd.
pause
exit /b 0

:fetch_fail
echo.
echo   Download failed. Check your network, then run setup.cmd again
echo   (it resumes where it stopped).
pause
exit /b 1
