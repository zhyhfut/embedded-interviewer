# 嵌入式面试模拟 Agent

> 模拟大疆、华为、理想、小米、OPPO 等公司嵌入式岗位面试，支持白菜/SP/SSP 三档难度自适应，涵盖 Linux 驱动、RTOS、系统架构、AI 辅助编程等方向。

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-latest-green)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 目录

- [功能特性](#功能特性)
- [系统要求](#系统要求)
- [快速开始（5 分钟上手）](#快速开始5-分钟上手)
- [详细安装步骤](#详细安装步骤)
- [配置说明](#配置说明)
- [如何切换模型和 API](#如何切换模型和-api)
- [使用指南](#使用指南)
- [项目结构](#项目结构)
- [API 接口文档](#api-接口文档)
- [Docker 部署](#docker-部署)
- [常见问题](#常见问题)

---

## 功能特性

### 面试能力
- **三档难度自适应**：白菜（基础岗）/ SP（核心研发）/ SSP（高级架构），根据回答质量自动升降档
- **七大考察领域**：C/C++ 语言、操作系统、网络通信、硬件驱动、系统设计、工具链、AI 辅助编程
- **项目关联提问**：从简历中的具体项目出发追问，不是八股文背诵
- **公司特色题**：大疆实时性、华为底层原理、车企功能安全、OPPO/小米产品场景
- **流式对话**：面试官逐字输出，真实模拟面试节奏

### 多模型支持
| 模型 | 说明 | 是否免费 |
|------|------|---------|
| Claude (Anthropic) | 效果最好 | 付费 |
| OpenAI (GPT-4o) | 效果好 | 付费 |
| 小米 MiMo | 国产开源模型 | 免费 |
| 豆包 (字节跳动) | 效果不错 | 有免费额度 |
| 自定义 (任何 OpenAI 兼容 API) | 本地模型如 ollama、vLLM 等 | 免费 |

### 简历输入
- **文件上传**：支持 PDF 和 DOCX 格式
- **飞书云文档**：直接粘贴飞书文档链接
- **文本粘贴**：直接粘贴简历内容
- **不提供简历**：也可以开始面试

### 报告输出
- **飞书云文档**：自动创建飞书文档（需配置飞书 App）
- **本地 Markdown 文件**：浏览器内直接下载

---

## 系统要求

| 组件 | 最低版本 | 说明 |
|------|---------|------|
| Python | 3.10+ | 后端运行环境 |
| Node.js | 18+ | 前端构建环境 |
| npm | 9+ | 通常随 Node.js 安装 |
| 操作系统 | Windows/macOS/Linux | 均支持 |

---

## 快速开始（5 分钟上手）

### 方法一：一键安装脚本（推荐）

```bash
# 1. 克隆或下载项目
cd embedded-interviewer

# 2. 运行安装脚本
chmod +x install.sh
./install.sh

# 3. 编辑配置文件（填入 API Key）
# Linux/macOS:
nano .env
# Windows:
notepad .env

# 4. 启动后端
cd backend
source venv/bin/activate    # Linux/macOS
# venv\Scripts\activate     # Windows
uvicorn main:app --reload

# 5. 新开一个终端，启动前端
cd frontend
npm run dev

# 6. 浏览器访问 http://localhost:3000
```

### 方法二：Docker（需要安装 Docker）

```bash
# 1. 编辑 .env 填入 API Key
cp .env.example .env
nano .env

# 2. 一键启动
docker compose up --build

# 3. 浏览器访问 http://localhost:3000
```

---

## 详细安装步骤

### 第一步：安装 Python

**Windows：**
1. 访问 https://www.python.org/downloads/
2. 下载 Python 3.10+ 安装包
3. 安装时勾选 "Add Python to PATH"

**macOS：**
```bash
brew install python3
```

**Ubuntu/Debian：**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

**验证安装：**
```bash
python3 --version
# 应显示 Python 3.10.x 或更高
```

### 第二步：安装 Node.js

1. 访问 https://nodejs.org
2. 下载 LTS 版本（推荐 18 或 20）
3. 按提示安装

**验证安装：**
```bash
node --version
# 应显示 v18.x.x 或更高
npm --version
# 应显示 9.x.x 或更高
```

### 第三步：安装项目依赖

**后端：**
```bash
cd backend

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate    # Linux/macOS
# venv\Scripts\activate     # Windows (cmd)
# venv\Scripts\Activate.ps1 # Windows (PowerShell)

# 安装依赖
pip install -r requirements.txt
```

**前端：**
```bash
cd frontend
npm install
```

### 第四步：配置 API Key

```bash
# 复制配置模板
cp .env.example .env

# 编辑 .env 文件，填入至少一个 API Key
```

**最简单的配置（使用免费的小米 MiMo）：**
```env
LLM_PROVIDER=xiaomi
XIAOMI_API_KEY=你的小米API密钥
```

**获取小米 MiMo API Key：**
1. 访问 https://api.xiaomi.com
2. 注册/登录账号
3. 创建应用，获取 API Key
4. 填入 .env 文件的 `XIAOMI_API_KEY`

**获取豆包 API Key：**
1. 访问 https://console.volcengine.com/ark
2. 注册/登录火山引擎账号
3. 创建 API Key
4. 填入 .env 文件的 `DOUBAO_API_KEY`

### 第五步：启动服务

**启动后端（终端 1）：**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
看到 `Application startup complete.` 就表示后端启动成功。

**启动前端（终端 2）：**
```bash
cd frontend
npm run dev
```
看到 `Local: http://localhost:3000/` 就表示前端启动成功。

### 第六步：开始使用

浏览器访问 **http://localhost:3000**，你会看到面试设置页面。

---

## 配置说明

### .env 文件完整配置

```env
# ============================================================
# LLM Provider 配置（至少配置一个）
# ============================================================
LLM_PROVIDER=claude          # 默认使用的 provider

# ---- Claude (Anthropic) ----
ANTHROPIC_API_KEY=           # 从 https://console.anthropic.com 获取
CLAUDE_MODEL=claude-sonnet-4-20250514

# ---- OpenAI ----
OPENAI_API_KEY=              # 从 https://platform.openai.com 获取
OPENAI_MODEL=gpt-4o

# ---- 小米 MiMo（免费）----
XIAOMI_API_KEY=              # 从 https://api.xiaomi.com 获取
XIAOMI_BASE_URL=https://api.xiaomi.com/v1
XIAOMI_MODEL=MiMo

# ---- 豆包（字节跳动）----
DOUBAO_API_KEY=              # 从火山引擎获取
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=ep-20260326194709-dfzbh  # 推理接入点 ID，不是通用模型名

# ---- 自定义（本地模型）----
CUSTOM_API_KEY=not-needed
CUSTOM_BASE_URL=http://localhost:11434/v1  # ollama 默认地址
CUSTOM_MODEL=qwen2.5:14b

# ============================================================
# 飞书集成（可选）
# ============================================================
FEISHU_APP_ID=               # 飞书开放平台 App ID
FEISHU_APP_SECRET=           # 飞书开放平台 App Secret

# ============================================================
# 服务配置
# ============================================================
HOST=0.0.0.0
PORT=8000
DATA_DIR=./data              # 简历缓存目录
```

### 使用本地模型（ollama）

如果你想完全免费使用，可以用 ollama 运行本地模型：

```bash
# 1. 安装 ollama（https://ollama.ai）
# 2. 拉取模型
ollama pull qwen2.5:14b

# 3. 配置 .env
LLM_PROVIDER=custom
CUSTOM_API_KEY=not-needed
CUSTOM_BASE_URL=http://localhost:11434/v1
CUSTOM_MODEL=qwen2.5:14b
```

---

## 如何切换模型和 API

所有 API 配置都在项目根目录的 `.env` 文件中。**换模型只需要改 `.env`，不需要改任何代码。**

### 规则

1. 修改 `.env` 中的 `LLM_PROVIDER` 为你想用的 provider
2. 填入对应的 `API_KEY`、`BASE_URL`、`MODEL`
3. 重启后端即可生效（前端不需要重启）

### 已支持的 Provider 一览

| LLM_PROVIDER 值 | 对应平台 | API Key 变量 | Base URL 变量 | Model 变量 |
|----------------|---------|-------------|--------------|-----------|
| `claude` | Anthropic Claude | `ANTHROPIC_API_KEY` | 无需配置 | `CLAUDE_MODEL` |
| `openai` | OpenAI | `OPENAI_API_KEY` | 无需配置 | `OPENAI_MODEL` |
| `xiaomi` | 小米 MiMo | `XIAOMI_API_KEY` | `XIAOMI_BASE_URL` | `XIAOMI_MODEL` |
| `doubao` | 豆包（字节跳动） | `DOUBAO_API_KEY` | `DOUBAO_BASE_URL` | `DOUBAO_MODEL` |
| `custom` | 任何 OpenAI 兼容 API | `CUSTOM_API_KEY` | `CUSTOM_BASE_URL` | `CUSTOM_MODEL` |

### 示例：从豆包换成小米 MiMo

编辑 `.env` 文件：

```env
# 把这行改成 xiaomi
LLM_PROVIDER=xiaomi

# 填入小米的配置
XIAOMI_API_KEY=你的key
XIAOMI_BASE_URL=https://api.xiaomi.com/v1
XIAOMI_MODEL=MiMo
```

重启后端：
```bash
# 找到并关闭旧进程
kill $(lsof -ti:8000) 2>/dev/null

# 重新启动
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 示例：接入新的第三方 API（如硅基流动 SiliconFlow）

如果某个平台不在已支持列表中，但它的 API 兼容 OpenAI 格式，使用 `custom` provider：

```env
LLM_PROVIDER=custom
CUSTOM_API_KEY=sk-xxxxxxxxxxxx
CUSTOM_BASE_URL=https://api.siliconflow.cn/v1    # 平台提供的 API 地址，必须以 /v1 结尾
CUSTOM_MODEL=Qwen/Qwen2.5-72B-Instruct           # 平台提供的模型名/ID
```

**判断 API 是否兼容 OpenAI 的方法**：如果这个平台的文档里给出的 curl 示例长这样，就能用：

```bash
curl https://xxx.com/v1/chat/completions \
  -H "Authorization: Bearer sk-xxx" \
  -d '{"model":"xxx","messages":[...]}'
```

### 注意事项

- **豆包的 model 不是通用模型名**，而是你在火山引擎控制台创建的"推理接入点 ID"（格式类似 `ep-20260326194709-dfzbh`）。获取方式：火山引擎控制台 → 火山方舟 → 在线推理 → 推理接入点
- **豆包的 base_url 是 `/api/v3` 不是 `/api/v1`**：`https://ark.cn-beijing.volces.com/api/v3`
- 修改 `.env` 后**必须重启后端**才能生效。前端会自动从后端获取可用 provider 列表，不需要重启
- 可以在 `.env` 中同时配置多个 provider 的 key，运行时通过 `LLM_PROVIDER` 选择使用哪个

---

## 使用指南

### 开始面试

1. **选择简历输入方式**：
   - **粘贴文本**：将简历内容复制粘贴到文本框
   - **上传文件**：点击上传 PDF 或 DOCX 简历文件
   - **飞书链接**：粘贴飞书云文档链接
   - **不提供**：直接开始，面试官会通过对话了解你的背景

2. **选择面试档位**：
   - **白菜**：基础岗，考察基本功
   - **SP**：核心研发岗，考察原理深度和工程能力（推荐）
   - **SSP**：高级架构岗，考察系统设计和底层原理

3. **选择 LLM 模型**：从已配置的模型中选择

4. **点击"开始面试"**

### 面试过程中

- 面试官会逐字输出问题，像真实面试一样
- **每次只回答一个核心问题**
- 回答完后点"发送"或按 Enter
- 可以随时输入"结束"来终止面试
- 面试过程中面试官会根据你的回答自动调整难度

### 生成报告

面试结束后：
1. 点击"生成面试报告"
2. 系统会自动生成包含以下内容的报告：
   - 逐题问答记录和评分
   - 综合评估（各维度评分、优劣势分析）
   - 知识盲区补充（附学习路径）
   - 简历优化建议
3. 可以下载 Markdown 文件或导出到飞书文档

---

## 项目结构

```
embedded-interviewer/
├── install.sh                   # 一键安装脚本
├── docker-compose.yml           # Docker 编排
├── .env.example                 # 环境变量模板
├── .env                         # 你的配置（git 不跟踪）
├── README.md                    # 本文档
│
├── backend/                     # Python 后端
│   ├── Dockerfile
│   ├── requirements.txt         # Python 依赖
│   ├── main.py                  # FastAPI 入口
│   ├── config.py                # 配置管理
│   ├── routers/                 # API 路由
│   │   ├── interview.py         # 面试对话（SSE 流式）
│   │   └── report.py            # 报告生成和导出
│   ├── services/                # 业务逻辑
│   │   ├── llm/                 # LLM 抽象层
│   │   │   ├── base.py          # 基类
│   │   │   ├── claude.py        # Claude API
│   │   │   ├── openai_llm.py    # OpenAI + 通用兼容
│   │   │   └── factory.py       # 工厂模式
│   │   ├── interview_engine.py  # 面试引擎核心
│   │   ├── resume_parser.py     # 简历解析
│   │   └── feishu_service.py    # 飞书集成
│   ├── models/                  # 数据模型
│   └── prompts/                 # System Prompt
│
├── frontend/                    # React 前端
│   ├── Dockerfile
│   ├── nginx.conf               # 生产环境 Nginx 配置
│   ├── package.json
│   └── src/
│       ├── App.tsx              # 主应用
│       ├── index.css            # 全局样式
│       ├── components/          # UI 组件
│       │   ├── Setup/           # 设置面板
│       │   ├── Chat/            # 聊天界面
│       │   └── Report/          # 报告面板
│       ├── hooks/               # React Hooks
│       ├── api/                 # API 调用
│       └── types/               # TypeScript 类型
│
└── data/                        # 运行时数据
    └── resumes/                 # 简历缓存（自动生成）
```

---

## API 接口文档

后端启动后，访问 http://localhost:8000/docs 查看 Swagger 自动生成的 API 文档。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/interview/providers` | 列出可用的 LLM provider |
| POST | `/api/interview/start` | 启动面试（multipart/form-data） |
| POST | `/api/interview/chat` | 发送回答（SSE 流式响应） |
| POST | `/api/interview/end` | 结束面试 |
| GET | `/api/interview/sessions/{id}` | 获取会话信息 |
| POST | `/api/report/generate/{id}` | 生成面试报告 |
| GET | `/api/report/export-file/{id}` | 下载报告文件 |
| POST | `/api/report/export-feishu` | 导出到飞书文档 |

---

## Docker 部署

### 本地开发
```bash
docker compose up --build
```
- 前端：http://localhost:3000
- 后端 API：http://localhost:8000

### 生产部署
```bash
# 修改 .env 中的配置
# 启动
docker compose -f docker-compose.yml up -d --build
```

### 只启动后端（前端由其他方式托管）
```bash
cd backend
docker build -t embedded-interviewer-backend .
docker run -p 8000:8000 --env-file ../.env embedded-interviewer-backend
```

---

## 常见问题

### Q: 启动时报 "ANTHROPIC_API_KEY is not set"
A: 检查 .env 文件中是否正确填入了 API Key，并确认 LLM_PROVIDER 设置正确。

### Q: 前端页面空白 / 请求失败
A: 确认后端已启动（http://localhost:8000/api/health 应返回 `{"status":"ok"}`）。前端开发服务器会自动代理 `/api` 请求到后端。

### Q: 使用小米 MiMo 报错
A: 确认 XIAOMI_BASE_URL 和 XIAOMI_MODEL 配置正确，且 API Key 有效。可以在 .env 中把 `LLM_PROVIDER` 改为 `xiaomi` 测试。

### Q: 上传 PDF 简历报错
A: 确认文件是标准的 PDF 或 DOCX 格式。扫描版 PDF（图片型）无法提取文字，需要是文字型 PDF。

### Q: 如何添加新的 LLM provider
A: 在 .env 中配置 CUSTOM_* 变量即可。只要 API 兼容 OpenAI 格式（支持 `/chat/completions` 端点），就能直接使用。

### Q: 面试到一半中断了，简历信息丢失了
A: 系统会自动将简历缓存到 `data/resumes/` 目录，长对话中会自动重新注入简历内容。

### Q: 如何使用飞书导出报告功能
A: 需要在 .env 中配置 FEISHU_APP_ID 和 FEISHU_APP_SECRET（从飞书开放平台获取），并授权文档读写权限。

### Q: Windows 上运行 install.sh 报错
A: Windows 用户可以用 Git Bash 运行，或者手动执行安装步骤（见"详细安装步骤"）。

---

## 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 后端框架 | FastAPI | 高性能 Python Web 框架 |
| 前端框架 | React + TypeScript | 组件化 UI 开发 |
| 样式 | Tailwind CSS v4 | 原子化 CSS |
| 构建工具 | Vite | 快速前端构建 |
| LLM SDK | anthropic / openai | 官方 Python SDK |
| 文件解析 | pdfplumber / python-docx | PDF 和 DOCX 解析 |
| 飞书集成 | lark-oapi | 飞书开放平台 SDK |
| 部署 | Docker Compose | 一键部署 |

---

## 许可证

MIT License
