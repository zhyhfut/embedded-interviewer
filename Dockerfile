# Railway 部署用 Dockerfile（根目录）
# 同时构建前端和后端

# ===== 第一阶段：构建前端 =====
FROM node:20-slim AS frontend-build

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ===== 第二阶段：运行后端 =====
FROM python:3.12-slim

WORKDIR /app

# 安装后端依赖
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ .

# 复制前端构建产物到 backend 同级目录
COPY --from=frontend-build /build/frontend/dist /frontend/dist

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
