import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # LLM Provider: claude / openai / xiaomi / doubao / custom
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "claude")

    # Claude
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")

    # 小米 MiMo（OpenAI 兼容接口）
    XIAOMI_API_KEY: str = os.getenv("XIAOMI_API_KEY", "")
    XIAOMI_BASE_URL: str = os.getenv("XIAOMI_BASE_URL", "https://api.xiaomi.com/v1")
    XIAOMI_MODEL: str = os.getenv("XIAOMI_MODEL", "MiMo")

    # 豆包 / 字节跳动（OpenAI 兼容接口）
    DOUBAO_API_KEY: str = os.getenv("DOUBAO_API_KEY", "")
    DOUBAO_BASE_URL: str = os.getenv("DOUBAO_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
    DOUBAO_MODEL: str = os.getenv("DOUBAO_MODEL", "doubao-pro-256k")

    # 自定义 OpenAI 兼容接口（适用于任何兼容 OpenAI API 的服务）
    CUSTOM_API_KEY: str = os.getenv("CUSTOM_API_KEY", "")
    CUSTOM_BASE_URL: str = os.getenv("CUSTOM_BASE_URL", "http://localhost:8080/v1")
    CUSTOM_MODEL: str = os.getenv("CUSTOM_MODEL", "default")

    # Feishu
    FEISHU_APP_ID: str = os.getenv("FEISHU_APP_ID", "")
    FEISHU_APP_SECRET: str = os.getenv("FEISHU_APP_SECRET", "")

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Data
    DATA_DIR: str = os.getenv("DATA_DIR", "./data")


settings = Settings()
