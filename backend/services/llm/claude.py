from typing import AsyncIterator
import anthropic
from .base import BaseLLM


class ClaudeLLM(BaseLLM):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = model

    async def chat(self, messages: list[dict], system_prompt: str) -> str:
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text

    async def chat_stream(
        self, messages: list[dict], system_prompt: str
    ) -> AsyncIterator[str]:
        async with self.client.messages.stream(
            model=self.model,
            max_tokens=4096,
            system=system_prompt,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text
