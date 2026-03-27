from .base import BaseLLM
from .claude import ClaudeLLM
from .openai_llm import OpenAILLM, OpenAICompatibleLLM
from config import settings


# 所有支持的 provider 列表（前端选择器使用）
AVAILABLE_PROVIDERS = [
    {"id": "claude", "name": "Claude (Anthropic)", "requires_key": "ANTHROPIC_API_KEY"},
    {"id": "openai", "name": "OpenAI (GPT-4o)", "requires_key": "OPENAI_API_KEY"},
    {"id": "xiaomi", "name": "小米 MiMo", "requires_key": "XIAOMI_API_KEY"},
    {"id": "doubao", "name": "豆包 (字节跳动)", "requires_key": "DOUBAO_API_KEY"},
    {"id": "custom", "name": "自定义 (OpenAI 兼容)", "requires_key": "CUSTOM_API_KEY"},
]


class LLMFactory:
    @staticmethod
    def create(provider: str | None = None) -> BaseLLM:
        provider = provider or settings.LLM_PROVIDER

        if provider == "claude":
            if not settings.ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY 未配置")
            return ClaudeLLM(
                api_key=settings.ANTHROPIC_API_KEY,
                model=settings.CLAUDE_MODEL,
            )

        elif provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY 未配置")
            return OpenAILLM(
                api_key=settings.OPENAI_API_KEY,
                model=settings.OPENAI_MODEL,
            )

        elif provider == "xiaomi":
            if not settings.XIAOMI_API_KEY:
                raise ValueError("XIAOMI_API_KEY 未配置")
            return OpenAICompatibleLLM(
                api_key=settings.XIAOMI_API_KEY,
                base_url=settings.XIAOMI_BASE_URL,
                model=settings.XIAOMI_MODEL,
            )

        elif provider == "doubao":
            if not settings.DOUBAO_API_KEY:
                raise ValueError("DOUBAO_API_KEY 未配置")
            return OpenAICompatibleLLM(
                api_key=settings.DOUBAO_API_KEY,
                base_url=settings.DOUBAO_BASE_URL,
                model=settings.DOUBAO_MODEL,
            )

        elif provider == "custom":
            if not settings.CUSTOM_API_KEY:
                raise ValueError("CUSTOM_API_KEY 未配置")
            return OpenAICompatibleLLM(
                api_key=settings.CUSTOM_API_KEY,
                base_url=settings.CUSTOM_BASE_URL,
                model=settings.CUSTOM_MODEL,
            )

        else:
            raise ValueError(
                f"未知的 LLM provider: {provider}，"
                f"可选值: {[p['id'] for p in AVAILABLE_PROVIDERS]}"
            )

    @staticmethod
    def get_available() -> list[dict]:
        """返回可用的 provider 列表（已配置 API Key 的）"""
        available = []
        for p in AVAILABLE_PROVIDERS:
            key = getattr(settings, p["requires_key"], "")
            if key:
                available.append(p)
        return available
