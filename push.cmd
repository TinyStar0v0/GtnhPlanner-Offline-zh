@echo off
chcp 65001 >nul
rem Push the already-committed repo to GitHub.
rem   push.cmd              -> normal push (Git for Windows will open a browser login)
rem   push.cmd <TOKEN>      -> push with a Personal Access Token (no browser, no helper)
rem The token is used once and the remote is reset to the clean URL afterwards.
setlocal
cd /d "%~dp0"

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

set "URL=https://github.com/TinyStar0v0/GtnhplannerWeb-zh.git"

if "%~1"=="" goto plain

echo   Pushing with the provided token...
%GIT% push "https://TinyStar0v0:%~1@github.com/TinyStar0v0/GtnhplannerWeb-zh.git" main
if errorlevel 1 goto fail
%GIT% remote set-url origin "%URL%"
echo.
echo   Done. The remote URL no longer contains the token.
echo   You can revoke the token on GitHub now.
pause
exit /b 0

:plain
if not exist ".git" (
  echo   .git not found - this folder is not the prepared repository.
  pause
  exit /b 1
)
%GIT% remote set-url origin "%URL%"
%GIT% push -u origin main
if errorlevel 1 goto fail
echo.
echo   Done.
pause
exit /b 0

:fail
echo.
echo   Push failed. See the messages above.
pause
exit /b 1
