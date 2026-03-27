from typing import AsyncIterator
import openai
from .base import BaseLLM


class OpenAILLM(BaseLLM):
    """OpenAI 官方 API"""

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.client = openai.AsyncOpenAI(api_key=api_key)
        self.model = model

    async def chat(self, messages: list[dict], system_prompt: str) -> str:
        full_messages = [
            {"role": "system", "content": system_prompt},
            *messages,
        ]
        response = await self.client.chat.completions.create(
            model=self.model,
            max_tokens=4096,
            messages=full_messages,
        )
        return response.choices[0].message.content

    async def chat_stream(
        self, messages: list[dict], system_prompt: str
    ) -> AsyncIterator[str]:
        full_messages = [
            {"role": "system", "content": system_prompt},
            *messages,
        ]
        stream = await self.client.chat.completions.create(
            model=self.model,
            max_tokens=4096,
            messages=full_messages,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content


class OpenAICompatibleLLM(BaseLLM):
    """通用 OpenAI 兼容 API（适用于小米 MiMo、豆包、通义千问、本地部署模型等）"""

    def __init__(self, api_key: str, base_url: str, model: str):
        self.client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
        )
        self.model = model

    async def chat(self, messages: list[dict], system_prompt: str) -> str:
        full_messages = [
            {"role": "system", "content": system_prompt},
            *messages,
        ]
        response = await self.client.chat.completions.create(
            model=self.model,
            max_tokens=4096,
            messages=full_messages,
        )
        return response.choices[0].message.content

    async def chat_stream(
        self, messages: list[dict], system_prompt: str
    ) -> AsyncIterator[str]:
        full_messages = [
            {"role": "system", "content": system_prompt},
            *messages,
        ]
        stream = await self.client.chat.completions.create(
            model=self.model,
            max_tokens=4096,
            messages=full_messages,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
