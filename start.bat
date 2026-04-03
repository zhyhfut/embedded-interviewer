@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ==========================================
echo   嵌入式面试模拟 Agent — 一键启动
echo ==========================================
echo.

REM 检查 .env
if not exist .env (
    echo [错误] 未找到 .env 文件
    echo   请先运行: install.bat
    pause
    exit /b 1
)

REM 检查 Python venv
if not exist backend\venv\Scripts\activate.bat (
    echo [错误] 未找到 Python 虚拟环境
    echo   请先运行: install.bat
    pause
    exit /b 1
)

REM 激活虚拟环境
call backend\venv\Scripts\activate.bat

REM 检查前端是否需要构建
if not exist frontend\dist\index.html (
    echo [信息] 前端未构建，正在构建...

    where npm >nul 2>&1
    if !errorlevel! neq 0 (
        echo [错误] 未找到 npm，请先安装 Node.js
        pause
        exit /b 1
    )

    cd /d "%~dp0frontend"
    call npm run build
    if !errorlevel! neq 0 (
        echo [错误] 前端构建失败
        cd /d "%~dp0"
        pause
        exit /b 1
    )
    cd /d "%~dp0"
    echo [OK] 前端构建完成
    echo.
)

echo [启动] 后端服务运行在 http://localhost:8000
echo [启动] 浏览器将自动打开...
echo [提示] 按 Ctrl+C 停止服务
echo.

REM 启动后端（会自动打开浏览器）
python backend\main.py
