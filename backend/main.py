from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
