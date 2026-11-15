# 把旧安装里的数据搬到新的安装目录（不重新下载 400 MB 配方和图标）。
#
#   powershell -ExecutionPolicy Bypass -File scripts\tools\migrate-install.ps1 -From "D:\gtnhplanner-old" -To "D:\gtnhplanner"
#   加 -IncludeDeps 连 node_modules 一起搬（省一次 npm install，但慢）
param(
    [Parameter(Mandatory = $true)][string]$From,
    [Parameter(Mandatory = $true)][string]$To,
    [switch]$IncludeDeps
)

$ErrorActionPreference = "Stop"

foreach ($dir in @($From, $To)) {
    if (-not (Test-Path $dir)) {
        Write-Host "目录不存在：$dir"
        exit 1
    }
}
$From = (Resolve-Path $From).Path
$To = (Resolve-Path $To).Path
if ($From -eq $To) {
    Write-Host "源和目标是同一个目录。"
    exit 0
}

function Copy-Tree([string]$name) {
    $src = Join-Path $From $name
    if (-not (Test-Path $src)) {
        Write-Host "跳过 $name（旧目录里没有）"
        return
    }
    $dst = Join-Path $To $name
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dst) | Out-Null
    Write-Host "复制 $name ..."
    # robocopy：/E 含子目录，/NFL /NDL 少刷屏，退出码 0-7 都算成功
    & robocopy $src $dst /E /NFL /NDL /NJH /NJS /MT:8 | Out-Null
    if ($LASTEXITCODE -ge 8) { Write-Host "  复制失败（robocopy $LASTEXITCODE）" }
}

Copy-Tree "public\datasets"
Copy-Tree ".tools"
if ($IncludeDeps) { Copy-Tree "node_modules" }

$logs = Join-Path $From "scratch\logs"
if (Test-Path $logs) {
    New-Item -ItemType Directory -Force -Path (Join-Path $To "scratch\logs") | Out-Null
    Copy-Item (Join-Path $logs "*") (Join-Path $To "scratch\logs") -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "数据已迁移到：$To"
if (-not $IncludeDeps) {
    Write-Host "依赖没搬：到新目录双击 setup.cmd（会跳过已下载的数据），或者加 -IncludeDeps 重跑。"
}
Write-Host "浏览器里的方案、设置是按站点（127.0.0.1:3100）存的，换目录不影响。"
