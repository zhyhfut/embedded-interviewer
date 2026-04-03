#!/bin/bash
set -e

echo "=========================================="
echo "  嵌入式面试模拟 Agent — 一键安装脚本"
echo "=========================================="
echo ""

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[错误] 未找到 python3，请先安装 Python 3.10+${NC}"
    echo "  Ubuntu/Debian: sudo apt install python3 python3-pip python3-venv"
    echo "  macOS: brew install python3"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}[OK]${NC} Python $PYTHON_VERSION"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] 未找到 node，请先安装 Node.js 18+${NC}"
    echo "  访问 https://nodejs.org 下载安装"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}[OK]${NC} Node.js $NODE_VERSION"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[错误] 未找到 npm${NC}"
    exit 1
fi

echo ""
echo "---- 安装后端依赖 ----"
cd "$(dirname "$0")/backend"
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt -q
echo -e "${GREEN}[OK]${NC} 后端依赖安装完成"

echo ""
echo "---- 安装前端依赖 ----"
cd "$(dirname "$0")/frontend"
npm install --silent 2>/dev/null
echo -e "${GREEN}[OK]${NC} 前端依赖安装完成"

echo ""
echo "---- 创建数据目录 ----"
cd "$(dirname "$0")"
mkdir -p data/resumes
echo -e "${GREEN}[OK]${NC} 数据目录创建完成"

# 创建 .env（如果不存在）
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}[提示]${NC} 已创建 .env 文件，请编辑此文件填入你的 API Key"
fi

echo ""
echo "=========================================="
echo -e "  ${GREEN}安装完成！${NC}"
echo "=========================================="
echo ""
echo "  下一步："
echo "  1. 编辑 .env 文件，填入至少一个 API Key"
echo "     推荐：小米 MiMo（免费）或 豆包"
echo ""
echo "  2. 一键启动（推荐）："
echo -e "     ${CYAN}bash start.sh${NC}"
echo ""
echo "  或手动启动："
echo "     后端: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "     前端: cd frontend && npm run dev"
echo ""
