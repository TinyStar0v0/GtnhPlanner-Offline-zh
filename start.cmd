@echo off
chcp 65001 >nul
rem GTNH Planner (Chinese, personal build). Double-click to start.
rem If Node.js is missing, a portable copy is downloaded into .tools\node first.
rem Every failure is explained and also written to scratch\logs\start.log.
setlocal
cd /d "%~dp0"
set "TMP=%~dp0.tmp"
set "TEMP=%~dp0.tmp"
if not exist "%TMP%" mkdir "%TMP%" >nul 2>&1

where node >nul 2>&1
if not errorlevel 1 goto run

if exist ".tools\node\node.exe" (
  set "PATH=%~dp0.tools\node;%PATH%"
  goto run
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

:run
node scripts\launch.mjs dev 3100 %*
if errorlevel 1 (
  echo   Start failed. The reason is above and in scratch\logs\start.log
  pause
)
