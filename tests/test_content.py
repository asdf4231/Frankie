"""content.py 单元测试：路径边界、FAQ/进度读取、隐藏目录判定。"""
import pytest

from frankie import content
from frankie.auth import shared_vault_ctx


def _patch(monkeypatch, tmp_path):
    """把数据根指向临时目录，保证测试确定性。"""
    from frankie.config import settings

    monkeypatch.setattr(settings, "frankie_data_dir", tmp_path / "data", raising=False)


def test_resolve_within_rejects_traversal(tmp_path, monkeypatch):
    _patch(monkeypatch, tmp_path)
    wiki_root = shared_vault_ctx().wiki_path
    wiki_root.mkdir(parents=True, exist_ok=True)

    # 正常相对路径
    ok = content._resolve_within("set-theory/sets-and-subsets.md")
    assert str(ok).startswith(str(wiki_root))

    # ../ 越界必须被拒绝
    with pytest.raises(ValueError):
        content._resolve_within("../../etc/passwd")

    # 绝对路径必须被拒绝
    with pytest.raises(ValueError):
        content._resolve_within("/etc/passwd")


def test_is_hidden_admin_path(tmp_path, monkeypatch):
    _patch(monkeypatch, tmp_path)
    from frankie.config import settings

    wiki_root = shared_vault_ctx().wiki_path
    admin = wiki_root / settings.content_admin_dir
    admin.mkdir(parents=True, exist_ok=True)
    (admin / "faq.md").write_text("# FAQ", encoding="utf-8")

    assert content.is_hidden_admin_path(admin / "faq.md") is True
    assert content.is_hidden_admin_path(wiki_root / "index.md") is False


def test_load_faq_progress_empty(tmp_path, monkeypatch):
    _patch(monkeypatch, tmp_path)
    # 尚无 FAQ / 进度文件时，返回 None，注入上下文为空
    assert content.load_faq() is None
    assert content.load_progress() is None
    assert content.answer_context() == ""
