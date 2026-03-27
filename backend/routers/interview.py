from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import json
import os
from datetime import datetime

from models.interview import InterviewSession, Message, MessageRole, Difficulty
from models.schemas import ChatRequest, EndInterviewRequest
from services.llm.factory import LLMFactory, AVAILABLE_PROVIDERS
from services.resume_parser import ResumeParser
from services.interview_engine import InterviewEngine
from services.feishu_service import feishu_service
from config import settings

router = APIRouter()

SESSIONS_DIR = os.path.join(settings.DATA_DIR, "sessions")


def _save_resume(session_id: str, resume_text: str):
    """将简历保存到本地 data/resumes/ 目录"""
    resume_dir = os.path.join(settings.DATA_DIR, "resumes")
    os.makedirs(resume_dir, exist_ok=True)
    filepath = os.path.join(resume_dir, f"{session_id}.txt")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(resume_text)


def _load_resume(session_id: str) -> str | None:
    """从本地加载简历"""
    filepath = os.path.join(settings.DATA_DIR, "resumes", f"{session_id}.txt")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    return None


def _session_to_dict(session: InterviewSession) -> dict:
    """将 session 序列化为可存储的 dict"""
    return {
        "session_id": session.session_id,
        "direction": session.direction,
        "resume_text": session.resume_text,
        "target_company": session.target_company,
        "target_direction": session.target_direction,
        "difficulty": session.difficulty.value,
        "messages": [
            {"role": m.role.value, "content": m.content,
             "timestamp": m.timestamp.isoformat()}
            for m in session.messages
        ],
        "topics_covered": list(session.topics_covered),
        "question_count": session.question_count,
        "created_at": session.created_at.isoformat(),
        "is_finished": session.is_finished,
        "report_content": session.report_content,
    }


def _session_from_dict(data: dict) -> InterviewSession:
    """从 dict 恢复 session"""
    session = InterviewSession(session_id=data["session_id"])
    session.direction = data.get("direction", "embedded")
    session.resume_text = data.get("resume_text", "")
    session.target_company = data.get("target_company", "")
    session.target_direction = data.get("target_direction", "")
    session.difficulty = Difficulty(data.get("difficulty", "SP"))
    session.messages = [
        Message(
            role=MessageRole(m["role"]),
            content=m["content"],
            timestamp=datetime.fromisoformat(m["timestamp"]) if "timestamp" in m else datetime.now(),
        )
        for m in data.get("messages", [])
    ]
    session.topics_covered = set(data.get("topics_covered", []))
    session.question_count = data.get("question_count", 0)
    session.created_at = datetime.fromisoformat(data["created_at"]) if "created_at" in data else datetime.now()
    session.is_finished = data.get("is_finished", False)
    session.report_content = data.get("report_content", "")
    return session


def _save_session(session: InterviewSession):
    """保存 session 到本地磁盘"""
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    filepath = os.path.join(SESSIONS_DIR, f"{session.session_id}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(_session_to_dict(session), f, ensure_ascii=False, indent=2)


def _load_session(session_id: str) -> InterviewSession | None:
    """从本地磁盘加载 session"""
    filepath = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return _session_from_dict(data)
    return None


@router.get("/providers")
async def list_providers():
    """列出所有已配置的 LLM provider"""
    return {"providers": LLMFactory.get_available(), "all": AVAILABLE_PROVIDERS}


# 内存中存储活跃会话
sessions: dict[str, InterviewSession] = {}


@router.post("/start")
async def start_interview(
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    feishu_link: Optional[str] = Form(None),
    difficulty: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    direction: Optional[str] = Form(None),
):
    """启动面试，支持文件上传/飞书链接/文本三种简历输入"""
    session = InterviewSession()

    if direction and direction in ("embedded", "embodied"):
        session.direction = direction

    if resume_file:
        file_bytes = await resume_file.read()
        session.resume_text = ResumeParser.parse_file(file_bytes, resume_file.filename)
    elif feishu_link:
        if feishu_service:
            session.resume_text = await feishu_service.read_document(feishu_link)
        else:
            session.resume_text = ResumeParser.parse_feishu_link(feishu_link)
    elif resume_text:
        session.resume_text = ResumeParser.parse_text(resume_text)

    if session.resume_text:
        _save_resume(session.session_id, session.resume_text)

    if difficulty:
        try:
            session.difficulty = Difficulty(difficulty)
        except ValueError:
            pass

    provider = model or None
    llm = LLMFactory.create(provider)

    engine = InterviewEngine(llm, session)
    sessions[session.session_id] = session

    async def generate():
        full_text = ""
        async for chunk in engine.start_interview():
            full_text += chunk
            yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"

        session.messages.append(
            Message(role=MessageRole.INTERVIEWER, content=full_text)
        )
        # 每次有新消息都保存
        _save_session(session)
        yield f"data: {json.dumps({'done': True, 'session_id': session.session_id}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/chat")
async def chat(request: ChatRequest):
    """发送候选人回答，获取下一个问题"""
    session = sessions.get(request.session_id)
    if not session:
        # 尝试从磁盘加载
        session = _load_session(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")
        sessions[request.session_id] = session

    if session.is_finished:
        raise HTTPException(status_code=400, detail="面试已结束")

    llm = LLMFactory.create()
    engine = InterviewEngine(llm, session)

    async def generate():
        full_text = ""
        async for chunk in engine.next_question(request.message):
            full_text += chunk
            yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"

        yield f"data: {json.dumps({'done': True, 'is_finished': session.is_finished}, ensure_ascii=False)}\n\n"
        # 每次对话后保存
        _save_session(session)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/end")
async def end_interview(request: EndInterviewRequest):
    """结束面试"""
    session = sessions.get(request.session_id)
    if not session:
        session = _load_session(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

    session.is_finished = True
    _save_session(session)
    return {"status": "ok", "session_id": request.session_id}


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """获取会话信息"""
    session = sessions.get(session_id)
    if not session:
        session = _load_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

    return {
        "session_id": session.session_id,
        "direction": session.direction,
        "difficulty": session.difficulty.value,
        "question_count": session.question_count,
        "topics_covered": list(session.topics_covered),
        "is_finished": session.is_finished,
        "message_count": len(session.messages),
        "created_at": session.created_at.isoformat(),
    }


# ---- 历史记录接口 ----

@router.get("/history")
async def list_history():
    """列出所有历史面试记录"""
    if not os.path.exists(SESSIONS_DIR):
        return {"sessions": []}

    files = sorted(
        [f for f in os.listdir(SESSIONS_DIR) if f.endswith(".json")],
        reverse=True,
    )

    result = []
    for fname in files:
        filepath = os.path.join(SESSIONS_DIR, fname)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            # 只返回摘要信息，不返回完整消息
            result.append({
                "session_id": data.get("session_id", ""),
                "direction": data.get("direction", "embedded"),
                "difficulty": data.get("difficulty", "SP"),
                "question_count": data.get("question_count", 0),
                "topics_covered": data.get("topics_covered", []),
                "created_at": data.get("created_at", ""),
                "is_finished": data.get("is_finished", False),
                "has_report": bool(data.get("report_content", "")),
                "message_count": len(data.get("messages", [])),
                # 从消息中提取第一条面试官的问题作为摘要
                "preview": _extract_preview(data.get("messages", [])),
            })
        except Exception:
            continue

    return {"sessions": result}


def _extract_preview(messages: list[dict]) -> str:
    """从消息中提取预览文字"""
    for msg in messages:
        if msg.get("role") == "interviewer":
            content = msg.get("content", "")
            if len(content) > 80:
                return content[:80] + "..."
            return content
    return "（无内容）"


@router.get("/history/{session_id}")
async def get_history_detail(session_id: str):
    """获取历史面试的完整内容（用于回看）"""
    session = _load_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="历史记录不存在")

    return {
        "session_id": session.session_id,
        "direction": session.direction,
        "difficulty": session.difficulty.value,
        "question_count": session.question_count,
        "topics_covered": list(session.topics_covered),
        "created_at": session.created_at.isoformat(),
        "is_finished": session.is_finished,
        "resume_text": session.resume_text,
        "report_content": session.report_content,
        "messages": [
            {"role": m.role.value, "content": m.content}
            for m in session.messages
        ],
    }


@router.delete("/history/{session_id}")
async def delete_history(session_id: str):
    """删除一条历史记录"""
    filepath = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if os.path.exists(filepath):
        os.remove(filepath)
        return {"status": "ok"}
    raise HTTPException(status_code=404, detail="记录不存在")
