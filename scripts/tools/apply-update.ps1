# 把更新包覆盖到已有的安装目录，保留数据（配方、图标、依赖、方案）。
#
#   powershell -ExecutionPolicy Bypass -File scripts\tools\apply-update.ps1 -Target "D:\gtnhplanner"
#
# 做的事：
#   1. 检查目标目录确实是一个安装（有 start.cmd）
#   2. 停掉正在跑的服务
#   3. 把要覆盖的文件备份到 <目标>\.backup\<时间>
#   4. 复制新代码，跳过 public\datasets、node_modules、.next、.tools、scratch
#   5. package.json 变了就重新装依赖
param(
    [Parameter(Mandatory = $false)][string]$Target
)

$ErrorActionPreference = "Stop"
$packageRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

if (-not $Target) {
    $Target = Read-Host "要更新哪个目录？（那个有 start.cmd 的文件夹）"
}
if (-not (Test-Path $Target)) {
    Write-Host "目录不存在：$Target"
    exit 1
}
$Target = (Resolve-Path $Target).Path
if (-not (Test-Path (Join-Path $Target "start.cmd"))) {
    Write-Host "这个目录里没有 start.cmd，看起来不是 GTNH Planner 的安装目录：$Target"
    exit 1
}
if ($Target -eq $packageRoot) {
    Write-Host "目标和更新包是同一个目录，不用更新。"
    exit 0
}

$skipDirs = @("public\datasets", "node_modules", ".next", ".tools", "scratch", ".tmp", ".git", ".backup")
function Should-Skip([string]$relative) {
    foreach ($skip in $skipDirs) {
        if ($relative -eq $skip -or $relative.StartsWith($skip + "\") -or $relative -eq $skip.Replace("\", "/")) { return $true }
    }
    return $false
}

# 1. 停服务
$stop = Join-Path $Target "stop.cmd"
if (Test-Path $stop) {
    Write-Host "停止正在运行的服务 ..."
    & cmd.exe /c "`"$stop`" 3100" | Out-Null
    Start-Sleep -Seconds 1
}

# 2. 收集要覆盖的文件
$files = Get-ChildItem -Path $packageRoot -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($packageRoot.Length + 1)
    -not (Should-Skip $rel)
}
Write-Host "要更新 $($files.Count) 个文件。"

# 3. 备份将被覆盖的文件
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $Target ".backup\$stamp"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
$backedUp = 0
foreach ($file in $files) {
    $rel = $file.FullName.Substring($packageRoot.Length + 1)
    $dest = Join-Path $Target $rel
    if (Test-Path $dest) {
        $backupPath = Join-Path $backup $rel
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backupPath) | Out-Null
        Copy-Item $dest $backupPath -Force
        $backedUp++
    }
}
Write-Host "已备份 $backedUp 个旧文件到 $backup"

# 4. 复制新文件
foreach ($file in $files) {
    $rel = $file.FullName.Substring($packageRoot.Length + 1)
    $dest = Join-Path $Target $rel
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
    Copy-Item $file.FullName $dest -Force
}
Write-Host "代码已更新。"

# 5. 依赖有变化就重装
$oldPkg = Join-Path $backup "package.json"
$newPkg = Join-Path $Target "package.json"
if ((Test-Path $oldPkg) -and (Test-Path $newPkg)) {
    $a = Get-Content $oldPkg -Raw
    $b = Get-Content $newPkg -Raw
    if ($a -ne $b) {
        Write-Host "package.json 变了，重新安装依赖 ..."
        Push-Location $Target
        try {
            $node = Join-Path $Target ".tools\node\node.exe"
            if (Test-Path $node) { $env:PATH = (Join-Path $Target ".tools\node") + ";" + $env:PATH }
            & cmd.exe /c "npm install --no-audit --no-fund --ignore-scripts"
        } finally {
            Pop-Location
        }
    }
}

Write-Host ""
Write-Host "更新完成。双击 $Target\start.cmd 启动。"
Write-Host "数据（配方、图标、方案）都保留着；旧版文件在 $backup 里，需要可以拷回去。"
