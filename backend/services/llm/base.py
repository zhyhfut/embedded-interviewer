from abc import ABC, abstractmethod
from typing import AsyncIterator


class BaseLLM(ABC):
    @abstractmethod
    async def chat(self, messages: list[dict], system_prompt: str) -> str:
        """完整响应"""
        ...

    @abstractmethod
    async def chat_stream(
        self, messages: list[dict], system_prompt: str
    ) -> AsyncIterator[str]:
        """流式响应，逐块 yield"""
        ...
