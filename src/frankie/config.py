"""Frankie 配置加载模块。

加载优先级（高 → 低）：
  1. 环境变量
  2. .env 文件
  3. config/settings.toml
  4. 代码中的默认值

多用户支持：VaultContext + ContextVar 机制见文件末尾。
"""

import contextlib
import contextvars
import tomllib
from dataclasses import dataclass
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# 项目根目录（src/frankie/config.py → 上三级）
_PROJECT_ROOT = Path(__file__).parent.parent.parent
_TOML_PATH = _PROJECT_ROOT / "config" / "settings.toml"


def _load_toml() -> dict:
    """读取 config/settings.toml，文件不存在时返回空字典。"""
    if _TOML_PATH.exists():
        with open(_TOML_PATH, "rb") as f:
            return tomllib.load(f)
    return {}


# 全局 toml 数据，模块加载时读取一次
_toml = _load_toml()


class Settings(BaseSettings):
    """Frankie 全局配置，统一从 .env 和 settings.toml 加载。"""

    model_config = SettingsConfigDict(
        env_file=str(_PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── LLM ───────────────────────────────────────────────
    deepseek_api_key: str = Field(
        default="",
        alias="DEEPSEEK_API_KEY",
        description="DeepSeek API Key",
    )
    llm_base_url: str = Field(
        default=_toml.get("llm", {}).get("base_url", "https://api.deepseek.com"),
        alias="FRANKIE_LLM_BASE_URL",
    )
    llm_default_model: str = Field(
        default=_toml.get("llm", {}).get("default_model", "deepseek-flash"),
        alias="FRANKIE_LLM_DEFAULT_MODEL",
    )
    llm_title_model: str = Field(
        default=_toml.get("llm", {}).get("title_model", "deepseek-flash"),
        description="生成会话标题的模型",
    )

    # ── Auth / 多用户 ─────────────────────────────────────
    frankie_data_dir: Path = Field(
        default=Path(_toml.get("auth", {}).get("data_dir", str(_PROJECT_ROOT / "data"))),
        alias="FRANKIE_DATA_DIR",
        description="账号、历史和个人资料目录",
    )
    auth_daily_token_limit: int = Field(
        default=_toml.get("auth", {}).get("daily_token_limit", 50000),
        description="每用户每日 token 限额（prompt + completion）",
    )
    auth_secret: str = Field(
        default="",
        alias="FRANKIE_AUTH_SECRET",
        description="用于签名会话 cookie 的密钥；生产环境必须设置",
    )

    # Course files are read directly from the separate Git checkout.
    course_wiki_path: Path = Field(
        default=Path(_toml.get("content", {}).get(
            "wiki_path", str(_PROJECT_ROOT.parent / "course" / "llm_wiki"),
        )),
        alias="FRANKIE_COURSE_WIKI_PATH",
    )

    @property
    def llm(self) -> _LLMProxy:
        return _LLMProxy(self)


class _LLMProxy:
    """LLM 配置的只读代理。"""

    def __init__(self, s: Settings) -> None:
        self._s = s

    @property
    def api_key(self) -> str:
        return self._s.deepseek_api_key

    @property
    def base_url(self) -> str:
        return self._s.llm_base_url

    @property
    def default_model(self) -> str:
        return self._s.llm_default_model

    @property
    def title_model(self) -> str:
        return self._s.llm_title_model


# 全局单例
settings = Settings()


def hidden_content_dirs() -> frozenset[str]:
    """概念 Wiki 检索跳过的资料目录。"""
    return frozenset({"raw", "slides"})


# ---------------------------------------------------------------------------
# Vault 上下文（多用户地基）
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class VaultContext:
    """Web 请求使用的课程或用户数据路径上下文。"""

    root: Path
    frankie_dir: Path | None = None
    raw_sources_dir: str = ""

    def require_writable(self) -> Path:
        if self.frankie_dir is None:
            raise PermissionError("只读 Wiki")
        return self.frankie_dir

    @property
    def wiki_path(self) -> Path:
        return self.root

    @property
    def raw_sources_path(self) -> Path | None:
        if self.raw_sources_dir:
            return self.root / self.raw_sources_dir
        return None


_vault_ctx_var: contextvars.ContextVar[VaultContext | None] = contextvars.ContextVar(
    "frankie_vault_ctx", default=None
)


def get_vault_ctx() -> VaultContext:
    """Return the current request's Vault context."""
    ctx = _vault_ctx_var.get()
    if ctx is None:
        raise RuntimeError("Vault context is not set")
    return ctx


def set_vault_ctx(ctx: VaultContext | None) -> contextvars.Token[VaultContext | None]:
    """设置当前上下文的 VaultContext，返回 Token 供复位。"""
    return _vault_ctx_var.set(ctx)


@contextlib.contextmanager
def use_vault_ctx(ctx: VaultContext):
    """临时切换 VaultContext（with 块结束后自动复位）。

    用于在已认证用户的请求内临时操作共享课程库等另一套 Vault。
    """
    token = _vault_ctx_var.set(ctx)
    try:
        yield ctx
    finally:
        _vault_ctx_var.reset(token)
