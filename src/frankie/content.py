"""课程内容管理模块。

职责：
- 读取 FAQ / 课程进度（常驻注入回答上下文）
- 管理员文件列表 / 读 / 写（FAQ、进度、Wiki 页面、讲义）

FAQ 与课程进度存放在共享课程库的 _admin/ 子目录（data/shared/frankie-wiki/_admin/），
对学生不可见（检索/文件库均已过滤），仅在管理员后台可编辑。
所有文件操作都限定在共享课程库（shared_vault_ctx().wiki_path）之内，
并对越界路径（../、绝对路径）做严格校验。
"""

from __future__ import annotations

from pathlib import Path

from frankie.auth import shared_vault_ctx
from frankie.config import settings


def admin_dir() -> Path:
    """管理文件目录（_admin/），存 FAQ 与课程进度。"""
    return shared_vault_ctx().wiki_path / settings.content_admin_dir


def faq_path() -> Path:
    return admin_dir() / settings.content_faq_file


def progress_path() -> Path:
    return admin_dir() / settings.content_progress_file


def _resolve_within(rel_path: str) -> Path:
    """将相对路径解析到共享 wiki 目录内，并做边界校验。

    不允许绝对路径；任何解析后越出共享 wiki 根目录的路径（含 .. 越界）都会被拒绝。
    """
    root = shared_vault_ctx().wiki_path.resolve()
    raw = rel_path.strip().replace("\\", "/")
    if not raw:
        raise ValueError("无效的文件路径")
    p = Path(raw)
    if p.is_absolute():
        raise ValueError("无效的文件路径")
    path = (root / p).resolve()
    if not path.is_relative_to(root):
        raise ValueError("只能操作共享课程库内的文件")
    return path


def is_hidden_admin_path(path: Path) -> bool:
    """判断路径是否位于 _admin 管理目录内（学生不可见）。"""
    root = shared_vault_ctx().wiki_path.resolve()
    try:
        rel = path.resolve().relative_to(root)
    except ValueError:
        return False
    return settings.content_admin_dir in rel.parts


# ---------------------------------------------------------------------------
# FAQ / 课程进度
# ---------------------------------------------------------------------------

def _read_if_exists(path: Path) -> str | None:
    if path.is_file():
        try:
            content = path.read_text(encoding="utf-8").strip()
            return content or None
        except OSError:
            return None
    return None


def load_faq() -> str | None:
    return _read_if_exists(faq_path())


def load_progress() -> str | None:
    return _read_if_exists(progress_path())


def answer_context() -> str:
    """构建常驻注入回答的 FAQ + 课程进度上下文块；两者都为空时返回空串。"""
    parts: list[str] = []
    faq = load_faq()
    if faq:
        parts.append(
            "【常见问题 Q&A】（若学生问题与其中某条实质相同，优先采用该条答案，"
            "结论与口径保持一致，不得给出与之矛盾的回答；可适当展开，但不要偏离其结论）\n" + faq
        )
    progress = load_progress()
    if progress:
        parts.append(
            "【当前课程进度】（回答时结合当前进度；若问题涉及尚未讲到的内容，"
            "先说明目前进度，并提示这部分还未讲到、后续会讲）\n" + progress
        )
    return "\n\n".join(parts)


# ---------------------------------------------------------------------------
# 管理员文件列表 / 读 / 写
# ---------------------------------------------------------------------------

def list_admin_files() -> list[dict]:
    """列出管理员可编辑的文件：FAQ/进度 + Wiki 页面 + raw 讲义。"""
    import frontmatter as fm

    wiki_path = shared_vault_ctx().wiki_path
    if not wiki_path.exists():
        return []

    admin_dir_name = settings.content_admin_dir
    result: list[dict] = []
    for p in sorted(wiki_path.rglob("*.md")):
        rel = str(p.relative_to(wiki_path)).replace("\\", "/")
        parts = p.relative_to(wiki_path).parts
        if admin_dir_name in parts:
            category = "管理文件"
        elif "raw" in parts or "slides" in parts:
            category = "讲义"
        else:
            category = "Wiki"

        title = ""
        try:
            title = str(fm.load(str(p)).get("title", "")).strip()
        except Exception:
            pass
        if not title:
            try:
                for line in p.read_text(encoding="utf-8", errors="ignore").splitlines()[:20]:
                    if line.startswith("# "):
                        title = line[2:].strip()
                        break
            except OSError:
                pass
        if not title:
            title = p.stem

        result.append({
            "rel_path": rel,
            "title": title,
            "category": category,
            "admin": admin_dir_name in parts,
        })

    order = {"管理文件": 0, "讲义": 1, "Wiki": 2}
    result.sort(key=lambda item: (order.get(item["category"], 3), item["rel_path"]))
    return result


def read_admin_file(rel_path: str) -> dict:
    path = _resolve_within(rel_path)
    if not path.is_file():
        raise FileNotFoundError(f"文件不存在：{rel_path}")
    if path.suffix.lower() != ".md":
        raise ValueError("只能编辑 Markdown 文件")
    return {"path": rel_path, "content": path.read_text(encoding="utf-8")}


def write_admin_file(rel_path: str, content: str) -> dict:
    """写文件（直接写盘，立即生效，无需重启）。"""
    path = _resolve_within(rel_path)
    if path.suffix.lower() != ".md":
        raise ValueError("只能编辑 Markdown 文件")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return {"ok": True, "path": rel_path}
