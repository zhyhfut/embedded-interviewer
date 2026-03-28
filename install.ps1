Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  嵌入式面试模拟 Agent — 一键安装脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[错误] 未找到 python，请先安装 Python 3.10+" -ForegroundColor Red
    Write-Host "  访问 https://www.python.org/downloads/ 下载安装"
    Write-Host "  安装时勾选 'Add Python to PATH'"
    Read-Host "按 Enter 退出"
    exit 1
}

$pythonVersion = (python --version 2>&1) -replace "Python ", ""
Write-Host "[OK] Python $pythonVersion" -ForegroundColor Green

# 检查 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[错误] 未找到 node，请先安装 Node.js 18+" -ForegroundColor Red
    Write-Host "  访问 https://nodejs.org 下载安装"
    Read-Host "按 Enter 退出"
    exit 1
}

$nodeVersion = node --version
Write-Host "[OK] Node.js $nodeVersion" -ForegroundColor Green

# 检查 npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[错误] 未找到 npm" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

Write-Host ""
Write-Host "---- 安装后端依赖 ----"
Set-Location (Join-Path $PSScriptRoot "backend")

python -m venv venv 2>$null
& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 后端依赖安装失败" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host "[OK] 后端依赖安装完成" -ForegroundColor Green

Write-Host ""
Write-Host "---- 安装前端依赖 ----"
Set-Location (Join-Path $PSScriptRoot "frontend")
npm install --silent 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 前端依赖安装失败" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host "[OK] 前端依赖安装完成" -ForegroundColor Green

Write-Host ""
Write-Host "---- 创建数据目录 ----"
Set-Location $PSScriptRoot
if (-not (Test-Path "data\resumes")) {
    New-Item -ItemType Directory -Path "data\resumes" -Force | Out-Null
}
Write-Host "[OK] 数据目录创建完成" -ForegroundColor Green

# 创建 .env（如果不存在）
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[提示] 已创建 .env 文件，请编辑此文件填入你的 API Key" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  安装完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  下一步："
Write-Host "  1. 编辑 .env 文件，填入至少一个 API Key"
Write-Host "     推荐：小米 MiMo（免费）或 豆包"
Write-Host ""
Write-Host "  2. 启动服务："
Write-Host "     后端: cd backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload"
Write-Host "     前端: cd frontend; npm run dev"
Write-Host ""
Write-Host "  3. 浏览器访问: http://localhost:3000"
Write-Host ""
Read-Host "按 Enter 退出"
