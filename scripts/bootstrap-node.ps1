# 便携版 Node.js 引导：本机没有 node 时，自动下载一个到 .tools\node 下。
# 由 start.cmd / setup.cmd 调用；成功返回 0，并把 .tools\node 加到 PATH 由调用方负责。
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root ".tools\node"
$zip = Join-Path $root ".tools\node.zip"
$tmp = Join-Path $root ".tools\node-tmp"

function Write-Step($text) { Write-Host "  $text" }

if (Test-Path (Join-Path $target "node.exe")) {
  Write-Step "便携版 Node.js 已存在，跳过下载。"
  exit 0
}

New-Item -ItemType Directory -Force -Path (Join-Path $root ".tools") | Out-Null

# 国内镜像优先，失败再退回官方源
$indexes = @(
  "https://registry.npmmirror.com/-/binary/node/index.json",
  "https://nodejs.org/dist/index.json"
)

$version = $null
foreach ($index in $indexes) {
  try {
    Write-Step "查询 Node.js 版本：$index"
    $list = Invoke-RestMethod -Uri $index -TimeoutSec 25 -UseBasicParsing
    $pick = $list | Where-Object { $_.version -match '^v22\.' } | Select-Object -First 1
    if ($pick) { $version = $pick.version; break }
  } catch {
    Write-Step "  （这个源不可用：$($_.Exception.Message)）"
  }
}
if (-not $version) {
  Write-Step "查不到版本，使用固定版本 v22.23.5"
  $version = "v22.23.5"
}

$candidates = @(
  "https://registry.npmmirror.com/-/binary/node/$version/node-$version-win-x64.zip",
  "https://nodejs.org/dist/$version/node-$version-win-x64.zip"
)

$downloaded = $false
foreach ($url in $candidates) {
  try {
    Write-Step "下载 Node.js $version ..."
    try {
      Invoke-WebRequest -Uri $url -OutFile $zip -TimeoutSec 900 -UseBasicParsing
    } catch {
      Write-Step "  Invoke-WebRequest 失败，改用 curl.exe"
      & curl.exe -L --fail --silent --show-error -o $zip $url
      if ($LASTEXITCODE -ne 0) { throw "curl 也失败了（退出码 $LASTEXITCODE）" }
    }
    if (-not (Test-Path $zip)) { throw "下载后没有文件" }
    $downloaded = $true
    break
  } catch {
    Write-Step "  下载失败：$($_.Exception.Message)"
  }
}
if (-not $downloaded) {
  Write-Step "Node.js 下载失败。请手动安装 https://nodejs.org/ 后重试。"
  exit 1
}

Write-Step "解压 ..."
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $tmp -Force
$inner = Get-ChildItem $tmp -Directory | Select-Object -First 1
if (-not $inner) {
  Write-Step "压缩包结构不对，解压失败。"
  exit 1
}
if (Test-Path $target) { Remove-Item $target -Recurse -Force }
Move-Item $inner.FullName $target
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $zip -Force -ErrorAction SilentlyContinue

$nodeExe = Join-Path $target "node.exe"
if (-not (Test-Path $nodeExe)) {
  Write-Step "解压后没找到 node.exe。"
  exit 1
}
$ver = & $nodeExe --version
Write-Step "便携版 Node.js 就绪：$ver（$target）"
exit 0
