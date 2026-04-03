import os
import sys
import webbrowser
import subprocess
import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import interview, report, config

app = FastAPI(title="嵌入式面试 Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(report.router, prefix="/api/report", tags=["report"])
app.include_router(config.router, prefix="/api", tags=["config"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# --- 前端静态文件服务 ---

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
DIST_DIR = os.path.join(PROJECT_ROOT, "frontend", "dist")
INDEX_HTML = os.path.join(DIST_DIR, "index.html")


def build_frontend():
    """如果前端未构建，自动执行 npm run build"""
    if os.path.exists(INDEX_HTML):
        return True

    frontend_dir = os.path.join(PROJECT_ROOT, "frontend")
    if not os.path.isdir(frontend_dir):
        print("[错误] frontend 目录不存在")
        return False

    print("[信息] 前端未构建，正在自动构建（首次可能需要 1-2 分钟）...")
    try:
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=frontend_dir,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(f"[错误] 前端构建失败:\n{result.stderr}")
            return False
        print("[OK] 前端构建完成")
        return True
    except FileNotFoundError:
        print("[错误] 未找到 npm，请先安装 Node.js")
        return False


if build_frontend() and os.path.isdir(os.path.join(DIST_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")


@app.get("/")
async def serve_index():
    if os.path.exists(INDEX_HTML):
        return FileResponse(INDEX_HTML)
    return {"error": "前端未构建，请先运行: cd frontend && npm run build"}


@app.get("/{path:path}")
async def serve_spa(path: str):
    """SPA catch-all：非 API 路由全部返回 index.html"""
    if os.path.exists(INDEX_HTML):
        return FileResponse(INDEX_HTML)
    return {"error": "前端未构建，请先运行: cd frontend && npm run build"}


def open_browser(url: str = "http://localhost:8000", delay: float = 1.5):
    """延迟打开浏览器，兼容 WSL / Linux / macOS"""
    def _open():
        import time
        time.sleep(delay)
        # WSL: 通过 cmd.exe 调用 Windows 默认浏览器
        if "microsoft" in os.uname().release.lower():
            try:
                subprocess.run(
                    ["cmd.exe", "/c", "start", url],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                return
            except FileNotFoundError:
                pass
        # Linux: xdg-open
        try:
            subprocess.run(
                ["xdg-open", url],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return
        except (FileNotFoundError, OSError):
            pass
        # macOS: open
        try:
            subprocess.run(
                ["open", url],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return
        except (FileNotFoundError, OSError):
            pass
        # 兜底
        webbrowser.open(url)
    threading.Thread(target=_open, daemon=True).start()


if __name__ == "__main__":
    import uvicorn

    auto_open = "--no-open" not in sys.argv
    if auto_open:
        open_browser()

    uvicorn.run(app, host="0.0.0.0", port=8000)
