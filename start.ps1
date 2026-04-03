Set-Location $PSScriptRoot

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  嵌入式面试模拟 Agent — 一键启动" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 .env
if (-not (Test-Path ".env")) {
    Write-Host "[错误] 未找到 .env 文件" -ForegroundColor Red
    Write-Host "  请先运行: .\install.ps1"
    Read-Host "按 Enter 退出"
    exit 1
}

# 检查 Python venv
if (-not (Test-Path "backend\venv\Scripts\Activate.ps1")) {
    Write-Host "[错误] 未找到 Python 虚拟环境" -ForegroundColor Red
    Write-Host "  请先运行: .\install.ps1"
    Read-Host "按 Enter 退出"
    exit 1
}

# 激活虚拟环境
& .\backend\venv\Scripts\Activate.ps1

# 检查前端是否需要构建
if (-not (Test-Path "frontend\dist\index.html")) {
    Write-Host "[信息] 前端未构建，正在构建..." -ForegroundColor Yellow

    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "[错误] 未找到 npm，请先安装 Node.js" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }

    Set-Location (Join-Path $PSScriptRoot "frontend")
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 前端构建失败" -ForegroundColor Red
        Set-Location $PSScriptRoot
        Read-Host "按 Enter 退出"
        exit 1
    }
    Set-Location $PSScriptRoot
    Write-Host "[OK] 前端构建完成" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[启动] 后端服务运行在 http://localhost:8000" -ForegroundColor Green
Write-Host "[启动] 浏览器将自动打开..." -ForegroundColor Green
Write-Host "[提示] 按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

# 启动后端（会自动打开浏览器）
python backend\main.py
