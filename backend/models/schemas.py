from pydantic import BaseModel
from typing import Optional
from models.interview import Difficulty


class StartInterviewRequest(BaseModel):
    resume_text: Optional[str] = None
    feishu_link: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    model: Optional[str] = None


class ChatRequest(BaseModel):
    session_id: str
    message: str


class EndInterviewRequest(BaseModel):
    session_id: str


class ReportExportFeishuRequest(BaseModel):
    session_id: str


class SessionInfo(BaseModel):
    session_id: str
    difficulty: str
    question_count: int
    is_finished: bool
