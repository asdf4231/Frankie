"""Extract chat attachments into model-ready text or image blocks."""

from __future__ import annotations

import base64
import math
import re
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024
MAX_EXTRACTED_CHARS = 120_000
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".png", ".jpg", ".jpeg"}
IMAGE_MIME_TYPES = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
# 按文件内容识别的格式决定存储后缀（手机 JPEG 常带多图扩展，Pillow 报为 MPO）
_IMAGE_FORMAT_SUFFIXES = {"JPEG": ".jpg", "MPO": ".jpg", "PNG": ".png"}
# DeepSeek 推理前会把每张图缩放到约 1300×1300 像素（每图最多 1024 token），更大的图只增加传输量。
# 浏览器端（Composer）先按同样的参数压一遍，这里兜底：够小的原样保留，其余缩放并转成 JPEG。
IMAGE_PIXEL_BUDGET = 1300 * 1300
IMAGE_PASSTHROUGH_BYTES = 500 * 1024
IMAGE_JPEG_QUALITY = 80
# 解码前只看文件头就拒绝像素过多的图：几 MB 的平滑 PNG 可以声明上亿像素，解码后占 1 GB 以上内存。
# 5000 万像素容得下手机的 48 MP 拍摄模式。
IMAGE_MAX_PIXELS = 50_000_000
_STORED_ATTACHMENT_NAME_RE = re.compile(r"^[a-f0-9]{32}\.(?:png|jpg|jpeg|pdf|docx|pptx)$")


@dataclass(frozen=True)
class PreparedAttachment:
    """A chat upload ready for the model and for storage."""

    name: str
    # Native Chat Completions input: an image_url block or extracted text
    content: dict | str
    # Bytes to store: the image as sent to the model, or the document as uploaded
    data: bytes
    # Stored file suffix; for images it follows the real format, not the filename
    suffix: str


def stored_attachment_path(root: Path, name: str) -> Path:
    """Resolve an app-generated attachment name within a user's data root."""
    if not _STORED_ATTACHMENT_NAME_RE.fullmatch(name):
        raise ValueError("非法附件标识")
    return root / "attachments" / name


def _fitted_size(size: tuple[int, int]) -> tuple[int, int]:
    """Scale a size down into IMAGE_PIXEL_BUDGET, keeping the aspect ratio."""
    width, height = size
    scale = math.sqrt(IMAGE_PIXEL_BUDGET / (width * height))
    if scale >= 1:
        return size
    return max(1, round(width * scale)), max(1, round(height * scale))


def normalize_image(data: bytes) -> tuple[bytes, str]:
    """Return image bytes fit for the model and their file suffix.

    只读文件头就拒绝像素过多的图；不超过 IMAGE_PASSTHROUGH_BYTES 的图原样保留（不解码）；
    其余按 EXIF 摆正、缩到像素预算并转成 JPEG，除非这样反而更大。
    """
    from PIL import Image, ImageOps

    try:
        image: Image.Image = Image.open(BytesIO(data))
    except Image.DecompressionBombError as exc:
        raise ValueError("图片像素过多") from exc
    except Exception as exc:  # Pillow 对损坏文件抛 OSError/SyntaxError/ValueError 不等
        raise ValueError("无法识别的图片文件") from exc
    suffix = _IMAGE_FORMAT_SUFFIXES.get(image.format or "")
    if suffix is None:
        raise ValueError(f"不支持的图片格式：{image.format}")
    if image.width * image.height > IMAGE_MAX_PIXELS:
        raise ValueError("图片像素过多（上限 5000 万像素）")
    if len(data) <= IMAGE_PASSTHROUGH_BYTES:
        return data, suffix

    try:
        if image.format in ("JPEG", "MPO"):
            # libjpeg 可按 1/2、1/4、1/8 解码；取不小于目标尺寸的最大缩减，省内存也省时间
            image.draft("RGB", _fitted_size(image.size))
        # 手机照片靠 EXIF 标记旋转，重新编码会丢掉它：先把方向烙进像素（原地，不复制）
        ImageOps.exif_transpose(image, in_place=True)
        if image.has_transparency_data:
            # JPEG 没有透明通道：透明区域铺白，而不是 Pillow 默认的黑
            rgba = image.convert("RGBA")
            image = Image.new("RGB", rgba.size, "white")
            image.paste(rgba, mask=rgba.getchannel("A"))
        elif image.mode != "RGB":
            image = image.convert("RGB")
        size = _fitted_size(image.size)
        if size != image.size:
            image = image.resize(size, Image.Resampling.LANCZOS)
        buffer = BytesIO()
        image.save(buffer, "JPEG", quality=IMAGE_JPEG_QUALITY, optimize=True)
    except OSError as exc:  # 像素数据不完整（上传中断）或损坏
        raise ValueError("图片文件不完整或已损坏") from exc
    encoded = buffer.getvalue()
    if len(encoded) >= len(data):
        return data, suffix
    return encoded, ".jpg"


def prepare_attachment(filename: str, data: bytes) -> PreparedAttachment:
    """Turn an upload into model input plus the bytes to store."""
    suffix = Path(filename).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        allowed = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise ValueError(f"不支持的文件类型，请上传：{allowed}")
    if not data:
        raise ValueError(f"文件为空：{filename}")
    if len(data) > MAX_ATTACHMENT_BYTES:
        raise ValueError(f"文件超过 20MB 上限：{filename}")

    if suffix in IMAGE_MIME_TYPES:
        data, suffix = normalize_image(data)
        encoded = base64.b64encode(data).decode("ascii")
        block = {
            "type": "image_url",
            "image_url": {"url": f"data:{IMAGE_MIME_TYPES[suffix]};base64,{encoded}"},
        }
        return PreparedAttachment(filename, block, data, suffix)

    if suffix == ".pdf":
        from pypdf import PdfReader

        text = "\n\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(data)).pages)
    elif suffix == ".docx":
        from docx import Document

        document = Document(BytesIO(data))
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)
        for table in document.tables:
            text += "\n" + "\n".join(" | ".join(cell.text for cell in row.cells) for row in table.rows)
    elif suffix == ".pptx":
        from pptx import Presentation

        presentation = Presentation(BytesIO(data))
        text = "\n\n".join(
            "\n".join(shape.text for shape in slide.shapes if hasattr(shape, "text"))
            for slide in presentation.slides
        )
    text = text.strip()
    if not text:
        text = "（未提取到文字内容，可能是扫描件或图片型文档）"
    if len(text) > MAX_EXTRACTED_CHARS:
        text = text[:MAX_EXTRACTED_CHARS] + "\n[附件文字已截断]"
    return PreparedAttachment(filename, f"【附件：{filename}】\n{text}", data, suffix)
