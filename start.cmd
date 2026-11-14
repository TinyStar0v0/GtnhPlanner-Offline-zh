@echo off
chcp 65001 >nul
rem GTNH Planner (Chinese, personal build). Double-click to start.
rem Runs a self-check first; the reason for any failure is printed and also
rem written to scratch\logs\start.log.
setlocal
cd /d "%~dp0"
set "TMP=%~dp0.tmp"
set "TEMP=%~dp0.tmp"
if not exist "%TMP%" mkdir "%TMP%" >nul 2>&1

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Node.js not found.
  echo   Install Node.js 18+ from https://nodejs.org/ then run this again.
  echo.
  pause
  exit /b 1
)

node scripts\launch.mjs dev 3100 %*
if errorlevel 1 (
  echo   Start failed. The reason is above and in scratch\logs\start.log
  pause
)
