@echo off
chcp 65001 >nul
rem First run: make sure Node.js exists, install dependencies, download the dataset.
rem About 400 MB in total. Run this once, then use start.cmd.
setlocal
cd /d "%~dp0"
set "TMP=%~dp0.tmp"
set "TEMP=%~dp0.tmp"
if not exist "%TMP%" mkdir "%TMP%" >nul 2>&1

where node >nul 2>&1
if not errorlevel 1 goto have_node
if exist ".tools\node\node.exe" (
  set "PATH=%~dp0.tools\node;%PATH%"
  goto have_node
)
echo.
echo   Node.js not found. Downloading a portable copy (about 35 MB)...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\bootstrap-node.ps1"
if errorlevel 1 (
  echo.
  echo   Portable Node.js could not be downloaded.
  echo   Install Node.js 18+ from https://nodejs.org/ and run this again.
  echo.
  pause
  exit /b 1
)
set "PATH=%~dp0.tools\node;%PATH%"

:have_node
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
node scripts\data\fetch-dataset.mjs .
if errorlevel 1 goto fetch_fail

echo   [3/4] Fetching the 1112 recipe shards...
node scripts\data\fetch-shards.mjs .
if errorlevel 1 goto fetch_fail

echo   [4/4] Fetching item icons (about 57k files, this takes a while)...
node scripts\data\fetch-icons.mjs .
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
