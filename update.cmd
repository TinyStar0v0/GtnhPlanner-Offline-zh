@echo off
chcp 65001 >nul
rem 检查并更新配方数据集（有新版本才下载）。
rem   update.cmd            检查 + 下载
rem   update.cmd --check    只检查，不下载
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
echo   Node.js not found. Run setup.cmd first.
pause
exit /b 1

:run
node scripts\data\update-dataset.mjs . %*
echo.
pause
