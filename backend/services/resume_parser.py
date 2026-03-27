import re
import httpx
import pdfplumber
from docx import Document
from io import BytesIO


class ResumeParser:
    @staticmethod
    def parse_file(file_bytes: bytes, filename: str) -> str:
        """解析上传的 PDF 或 DOCX 文件"""
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

        if ext == "pdf":
            return ResumeParser._parse_pdf(file_bytes)
        elif ext in ("docx", "doc"):
            return ResumeParser._parse_docx(file_bytes)
        else:
            raise ValueError(f"不支持的文件格式: {ext}，请上传 PDF 或 DOCX 文件")

    @staticmethod
    def _parse_pdf(file_bytes: bytes) -> str:
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            text_parts = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        return "\n".join(text_parts)

    @staticmethod
    def _parse_docx(file_bytes: bytes) -> str:
        doc = Document(BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)

    @staticmethod
    def parse_feishu_link(url: str) -> str:
        """解析飞书云文档链接，提取 token"""
        # 支持格式:
        # https://xxx.feishu.cn/wiki/TOKEN
        # https://xxx.feishu.cn/docx/TOKEN
        # https://xxx.feishu.cn/file/TOKEN

        patterns = [
            r"feishu\.cn/wiki/([A-Za-z0-9]+)",
            r"feishu\.cn/docx/([A-Za-z0-9]+)",
            r"feishu\.cn/file/([A-Za-z0-9]+)",
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                token = match.group(1)
                link_type = pattern.split("/")[1].rstrip("\\")
                return f"[飞书文档 token={token} type={link_type}]"

        raise ValueError(f"无法解析飞书链接: {url}，请检查链接格式")

    @staticmethod
    def parse_text(text: str) -> str:
        """直接使用粘贴的文本"""
        return text.strip()
