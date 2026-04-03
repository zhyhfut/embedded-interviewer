#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}=========================================="
echo -e "  嵌入式面试模拟 Agent — 一键启动"
echo -e "==========================================${NC}"
echo ""

# 检查 .env
if [ ! -f .env ]; then
    echo -e "${RED}[错误] 未找到 .env 文件${NC}"
    echo "  请先运行: bash install.sh"
    exit 1
fi

# 检查 Python venv
if [ ! -d backend/venv ]; then
    echo -e "${RED}[错误] 未找到 Python 虚拟环境${NC}"
    echo "  请先运行: bash install.sh"
    exit 1
fi

# 激活虚拟环境
source backend/venv/bin/activate

# 检查前端是否需要构建
if [ ! -f frontend/dist/index.html ]; then
    echo -e "${YELLOW}[信息] 前端未构建，正在构建...${NC}"
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}[错误] 未找到 npm，请先安装 Node.js${NC}"
        exit 1
    fi
    cd frontend
    npm run build
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}[OK] 前端构建完成${NC}"
    echo ""
fi

echo -e "${GREEN}[启动]${NC} 后端服务运行在 http://localhost:8000"
echo -e "${GREEN}[启动]${NC} 浏览器将自动打开..."
echo -e "${YELLOW}[提示]${NC} 按 Ctrl+C 停止服务"
echo ""

# 启动后端（会自动打开浏览器）
python backend/main.py
