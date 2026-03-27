from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from models.schemas import ReportExportFeishuRequest
from services.llm.factory import LLMFactory
from services.interview_engine import InterviewEngine
from services.feishu_service import feishu_service
from routers.interview import sessions, _save_session, _load_session

router = APIRouter()


@router.post("/generate/{session_id}")
async def generate_report(session_id: str):
    """生成面试报告"""
    session = sessions.get(session_id)
    if not session:
        session = _load_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

    llm = LLMFactory.create()
    engine = InterviewEngine(llm, session)
    report = await engine.generate_report()

    # 保存报告到磁盘
    _save_session(session)

    return {"report": report, "session_id": session_id}


@router.get("/export-file/{session_id}")
async def export_report_file(session_id: str, format: str = "markdown"):
    """导出面试报告为本地文件"""
    session = sessions.get(session_id)
    if not session:
        session = _load_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

    if not session.report_content:
        llm = LLMFactory.create()
        engine = InterviewEngine(llm, session)
        await engine.generate_report()
        _save_session(session)

    if format == "markdown":
        return Response(
            content=session.report_content,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename=interview_report_{session_id}.md"
            },
        )
    else:
        raise HTTPException(status_code=400, detail=f"不支持的导出格式: {format}")


@router.post("/export-feishu")
async def export_to_feishu(request: ReportExportFeishuRequest):
    """导出面试报告到飞书云文档"""
    if not feishu_service:
        raise HTTPException(status_code=400, detail="飞书服务未配置，请设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET")

    session = sessions.get(request.session_id)
    if not session:
        session = _load_session(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

    if not session.report_content:
        llm = LLMFactory.create()
        engine = InterviewEngine(llm, session)
        await engine.generate_report()
        _save_session(session)

    from datetime import datetime
    title = f"嵌入式面试报告 - {datetime.now().strftime('%Y.%m.%d')}"
    doc_url = await feishu_service.create_document(title, session.report_content)

    return {"feishu_url": doc_url, "session_id": request.session_id}
