import re
import httpx
from config import settings


class FeishuService:
    """飞书开放平台 API 封装"""

    BASE_URL = "https://open.feishu.cn/open-apis"

    def __init__(self):
        self.app_id = settings.FEISHU_APP_ID
        self.app_secret = settings.FEISHU_APP_SECRET
        self._token = None

    async def _get_tenant_token(self) -> str:
        if self._token:
            return self._token

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.BASE_URL}/auth/v3/tenant_access_token/internal",
                json={"app_id": self.app_id, "app_secret": self.app_secret},
            )
            data = resp.json()
            if data.get("code") != 0:
                raise Exception(f"飞书认证失败: {data}")
            self._token = data["tenant_access_token"]
            return self._token

    def _parse_link(self, url: str) -> tuple[str, str]:
        """解析飞书链接，返回 (token, type)"""
        patterns = [
            (r"feishu\.cn/wiki/([A-Za-z0-9]+)", "wiki"),
            (r"feishu\.cn/docx/([A-Za-z0-9]+)", "docx"),
        ]
        for pattern, doc_type in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1), doc_type
        raise ValueError(f"无法解析飞书链接: {url}")

    async def read_document(self, url: str) -> str:
        """读取飞书文档内容"""
        token, doc_type = self._parse_link(url)
        bearer = await self._get_tenant_token()
        headers = {"Authorization": f"Bearer {bearer}"}

        async with httpx.AsyncClient() as client:
            if doc_type == "wiki":
                # 先通过 wiki token 获取 obj_token
                resp = await client.get(
                    f"{self.BASE_URL}/wiki/v2/spaces/get_node",
                    headers=headers,
                    params={"token": token},
                )
                data = resp.json()
                if data.get("code") != 0:
                    raise Exception(f"读取 wiki 节点失败: {data}")
                obj_token = data["data"]["node"]["obj_token"]
            else:
                obj_token = token

            # 读取文档内容
            resp = await client.get(
                f"{self.BASE_URL}/docx/v1/documents/{obj_token}/raw_content",
                headers=headers,
            )
            data = resp.json()
            if data.get("code") != 0:
                raise Exception(f"读取文档内容失败: {data}")
            return data["data"]["content"]

    async def create_document(self, title: str, content: str) -> str:
        """创建飞书文档，返回文档 URL"""
        bearer = await self._get_tenant_token()
        headers = {
            "Authorization": f"Bearer {bearer}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            # 创建文档
            resp = await client.post(
                f"{self.BASE_URL}/docx/v1/documents",
                headers=headers,
                json={"title": title},
            )
            data = resp.json()
            if data.get("code") != 0:
                raise Exception(f"创建文档失败: {data}")

            doc_id = data["data"]["document"]["document_id"]

            # 写入内容（通过 raw_content 端点）
            resp = await client.put(
                f"{self.BASE_URL}/docx/v1/documents/{doc_id}/raw_content",
                headers=headers,
                json={"content": content},
            )

            return f"https://feishu.cn/docx/{doc_id}"


feishu_service = FeishuService() if settings.FEISHU_APP_ID else None
