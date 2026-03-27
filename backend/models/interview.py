from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import uuid
from datetime import datetime


class Difficulty(str, Enum):
    BAICAI = "白菜"
    SP = "SP"
    SSP = "SSP"


class MessageRole(str, Enum):
    SYSTEM = "system"
    INTERVIEWER = "interviewer"
    CANDIDATE = "candidate"


@dataclass
class Message:
    role: MessageRole
    content: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class InterviewSession:
    session_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    direction: str = "embedded"  # "embedded" 或 "embodied"
    resume_text: str = ""
    target_company: str = ""
    target_direction: str = ""
    difficulty: Difficulty = Difficulty.SP
    messages: list[Message] = field(default_factory=list)
    topics_covered: set[str] = field(default_factory=set)
    question_count: int = 0
    consecutive_good: int = 0
    consecutive_poor: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    is_finished: bool = False
    report_content: str = ""
