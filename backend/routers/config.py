from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import os

router = APIRouter()

ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")

# 需要暴露给前端的配置项（不包含实际值，只显示是否已配置）
CONFIG_FIELDS = {
    "LLM_PROVIDER": {"label": "默认 Provider", "type": "select", "options": ["claude", "openai", "xiaomi", "doubao", "custom"]},
    "ANTHROPIC_API_KEY": {"label": "Claude API Key", "type": "password", "provider": "claude"},
    "CLAUDE_MODEL": {"label": "Claude 模型", "type": "text", "provider": "claude"},
    "OPENAI_API_KEY": {"label": "OpenAI API Key", "type": "password", "provider": "openai"},
    "OPENAI_MODEL": {"label": "OpenAI 模型", "type": "text", "provider": "openai"},
    "XIAOMI_API_KEY": {"label": "小米 MiMo API Key", "type": "password", "provider": "xiaomi"},
    "XIAOMI_BASE_URL": {"label": "小米 Base URL", "type": "text", "provider": "xiaomi"},
    "XIAOMI_MODEL": {"label": "小米 模型", "type": "text", "provider": "xiaomi"},
    "DOUBAO_API_KEY": {"label": "豆包 API Key", "type": "password", "provider": "doubao"},
    "DOUBAO_BASE_URL": {"label": "豆包 Base URL", "type": "text", "provider": "doubao"},
    "DOUBAO_MODEL": {"label": "豆包 模型 (接入点 ID)", "type": "text", "provider": "doubao"},
    "CUSTOM_API_KEY": {"label": "自定义 API Key", "type": "password", "provider": "custom"},
    "CUSTOM_BASE_URL": {"label": "自定义 Base URL", "type": "text", "provider": "custom"},
    "CUSTOM_MODEL": {"label": "自定义 模型", "type": "text", "provider": "custom"},
    "FEISHU_APP_ID": {"label": "飞书 App ID", "type": "text"},
    "FEISHU_APP_SECRET": {"label": "飞书 App Secret", "type": "password"},
}


def _parse_env() -> dict[str, str]:
    """解析 .env 文件为字典"""
    config = {}
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    config[key.strip()] = value.strip()
    return config


def _write_env(config: dict[str, str]):
    """将字典写回 .env 文件，保留注释和格式"""
    lines = []
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if stripped and not stripped.startswith("#") and "=" in stripped:
                    key, _, _ = stripped.partition("=")
                    key = key.strip()
                    if key in config:
                        lines.append(f"{key}={config[key]}\n")
                    else:
                        lines.append(line)
                else:
                    lines.append(line)
    else:
        for key, value in config.items():
            lines.append(f"{key}={value}\n")

    with open(ENV_FILE, "w", encoding="utf-8") as f:
        f.writelines(lines)


@router.get("/config")
async def get_config():
    """获取当前配置（API Key 只显示是否已配置，不返回实际值）"""
    raw = _parse_env()
    result = {}
    for key, meta in CONFIG_FIELDS.items():
        value = raw.get(key, "")
        if meta["type"] == "password":
            # 密码类字段只返回是否已配置
            result[key] = {
                "value": "********" if value and value != "not-needed" else "",
                "is_set": bool(value) and value != "not-needed",
                **meta,
            }
        else:
            result[key] = {
                "value": value,
                "is_set": bool(value),
                **meta,
            }
    return {"config": result}


class ConfigUpdate(BaseModel):
    config: dict[str, str]


@router.post("/config")
async def update_config(body: ConfigUpdate):
    """更新配置并写入 .env 文件"""
    # 只允许更新已知的配置项
    filtered = {k: v for k, v in body.config.items() if k in CONFIG_FIELDS}

    # 读取当前配置，合并更新
    current = _parse_env()
    current.update(filtered)

    # 写回 .env
    _write_env(current)

    # 重新加载环境变量
    from dotenv import load_dotenv
    load_dotenv(override=True)

    # 重新加载 config
    import importlib
    import config as cfg
    importlib.reload(cfg)

    return {"status": "ok", "message": "配置已保存，部分更改可能需要重启后端才能生效"}
