# 注册 / 注销「每天自动检查数据集更新」的 Windows 计划任务。
#
#   powershell -ExecutionPolicy Bypass -File scripts\tools\register-daily-update.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\tools\register-daily-update.ps1 -Time 03:30
#   powershell -ExecutionPolicy Bypass -File scripts\tools\register-daily-update.ps1 -Remove
param(
    [string]$Time = "04:00",
    [switch]$Remove
)

$ErrorActionPreference = "Stop"
$taskName = "GTNH Planner 数据自动更新"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$node = Join-Path $root ".tools\node\node.exe"
$script = Join-Path $root "scripts\data\update-dataset.mjs"
$log = Join-Path $root "scratch\logs\update.log"

if ($Remove) {
    schtasks /Delete /TN $taskName /F 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host "已删除计划任务：$taskName" }
    else { Write-Host "没有找到计划任务：$taskName" }
    exit 0
}

if (-not (Test-Path $script)) {
    Write-Host "找不到 $script"
    exit 1
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $log) | Out-Null

# 有便携版 Node 就用它，否则用系统 PATH 里的 node
$nodeCmd = if (Test-Path $node) { "`"$node`"" } else { "node" }
$action = "cmd.exe /c cd /d `"$root`" && `"$nodeCmd`" `"$script`" . >> `"$log`" 2>&1"

schtasks /Create /TN $taskName /TR $action /SC DAILY /ST $Time /F | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "创建失败。可以试试用管理员身份运行，或者手动在「任务计划程序」里加。"
    exit 1
}

Write-Host "已注册计划任务：$taskName"
Write-Host "  时间：每天 $Time"
Write-Host "  命令：$action"
Write-Host "  日志：$log"
Write-Host ""
Write-Host "取消：powershell -ExecutionPolicy Bypass -File scripts\tools\register-daily-update.ps1 -Remove"
