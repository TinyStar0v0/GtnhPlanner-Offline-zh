@echo off
chcp 65001 >nul
rem One-click publish: init repo, commit, add remote, push.
rem Requires Git for Windows (https://git-scm.com/download/win).
setlocal enabledelayedexpansion
cd /d "%~dp0..\.."

set "GIT=git"
where git >nul 2>&1
if not errorlevel 1 goto have_git
if exist ".tools\git\cmd\git.exe" (
  set "GIT=.tools\git\cmd\git.exe"
  goto have_git
)
echo.
echo   Git not found. Either install Git for Windows:
echo   https://git-scm.com/download/win
echo   or keep the bundled portable git in .tools\git.
echo.
pause
exit /b 1
:have_git

rem --- identity -------------------------------------------------------------
set "EMAIL="
for /f "delims=" %%e in ('%GIT% config user.email 2^>nul') do set "EMAIL=%%e"
if not "!EMAIL!"=="" goto have_identity
echo   No git identity yet.
set /p NAME=  Your name (shown in commits): 
set /p EMAIL=  Your email (GitHub noreply is fine): 
%GIT% config --global user.name "!NAME!"
%GIT% config --global user.email "!EMAIL!"
:have_identity

rem --- init + commit --------------------------------------------------------
if not exist ".git" (
  %GIT% init -b main || goto :fail
)
%GIT% add -A || goto :fail
%GIT% commit -m "Chinese localization, local dataset, community features removed"
if errorlevel 1 (
  echo   Nothing new to commit, continuing.
)

rem --- remote ---------------------------------------------------------------
set "REMOTE="
for /f "delims=" %%r in ('%GIT% remote get-url origin 2^>nul') do set "REMOTE=%%r"
if not "!REMOTE!"=="" goto have_remote
set /p REMOTE=  Repo URL (https://github.com/USER/gtnhplanner-zh.git): 
%GIT% remote add origin "!REMOTE!" || goto :fail
:have_remote

echo.
echo   Pushing to !REMOTE! ...
echo   A browser window may open for GitHub sign-in.
%GIT% push -u origin main
if errorlevel 1 goto :fail
echo.
echo   Done. Next time: %GIT% add -A ^&^& %GIT% commit -m "..." ^&^& %GIT% push
pause
exit /b 0

:fail
echo.
echo   Failed. See the messages above.
pause
exit /b 1
