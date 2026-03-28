@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ==========================================
echo   嵌入式面试模拟 Agent — 一键安装脚本
echo ==========================================
echo.

REM 检查 Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 python，请先安装 Python 3.10+
    echo   访问 https://www.python.org/downloads/ 下载安装
    echo   安装时勾选 "Add Python to PATH"
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Python %PYTHON_VERSION%

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 node，请先安装 Node.js 18+
    echo   访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)

for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%

REM 检查 npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 npm
    pause
    exit /b 1
)

echo.
echo ---- 安装后端依赖 ----
cd /d "%~dp0backend"

python -m venv venv 2>nul
call venv\Scripts\activate.bat
pip install -r requirements.txt -q
if %errorlevel% neq 0 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)
echo [OK] 后端依赖安装完成

echo.
echo ---- 安装前端依赖 ----
cd /d "%~dp0frontend"
npm install --silent 2>nul
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败
    pause
    exit /b 1
)
echo [OK] 前端依赖安装完成

echo.
echo ---- 创建数据目录 ----
cd /d "%~dp0"
if not exist data\resumes mkdir data\resumes
echo [OK] 数据目录创建完成

REM 创建 .env（如果不存在）
if not exist .env (
    copy .env.example .env >nul
    echo [提示] 已创建 .env 文件，请编辑此文件填入你的 API Key
)

echo.
echo ==========================================
echo   安装完成！
echo ==========================================
echo.
echo   下一步：
echo   1. 编辑 .env 文件，填入至少一个 API Key
echo      推荐：小米 MiMo（免费）或 豆包
echo.
echo   2. 启动服务：
echo      后端: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn main:app --reload
echo      前端: cd frontend ^&^& npm run dev
echo.
echo   3. 浏览器访问: http://localhost:3000
echo.
pause
