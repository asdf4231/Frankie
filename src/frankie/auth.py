"""认证边界层（多用户）。

设计原则：Frankie 不关心用户"如何登录"，只关心"已验证的身份"。

    HTTP 请求 → resolve_user(request) → UserIdentity → VaultContext → 业务逻辑

接入学校统一认证（由老师实现）：
  只需修改本文件中的 resolve_user()（或新增一个 provider 函数），
  用学校的 SSO/ticket/session 校验替换当前的 dev provider，
  返回 UserIdentity(user_id=学号) 即可。
  下游的目录隔离、双层知识库、每日配额全部自动生效，无需改动。

当前为 dev provider（仅限本地开发/联调）：
  从请求头 X-Frankie-User 取学号，缺省回落到 "demo" 测试账号。
  上线前必须替换！
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from fastapi import Request

from frankie.config import VaultContext, settings

# ---------------------------------------------------------------------------
# 数据目录布局
# ---------------------------------------------------------------------------
# {FRANKIE_DATA_DIR}/
# ├── shared/                 课程共享库（admin 写，全员只读）
# │   ├── origin-sources/
# │   ├── frankie-wiki/
# │   └── .frankie/
# └── users/{user_id}/        个人库（严格隔离）
#     ├── origin-sources/
#     ├── frankie-wiki/
#     └── .frankie/           ingest_log / token_log / history

_SHARED_DIR = "shared"
_USERS_DIR = "users"
_WIKI_DIR = "frankie-wiki"
_RAW_SOURCES_DIR = "origin-sources"

# user_id 允许字符（学号/工号；含中文名兼容）
_USER_ID_PATTERN = re.compile(r"[A-Za-z0-9_\-.一-鿿]{1,64}")


def data_root() -> Path:
    """多用户数据根目录（FRANKIE_DATA_DIR，默认 ./data）。"""
    return settings.frankie_data_dir


def shared_vault_ctx() -> VaultContext:
    """课程共享库上下文。"""
    root = data_root() / _SHARED_DIR
    return VaultContext(
        root=root,
        frankie_dir=root / ".frankie",
        wiki_dir=_WIKI_DIR,
        raw_sources_dir=_RAW_SOURCES_DIR,
    )


def user_vault_ctx(user_id: str) -> VaultContext:
    """指定用户的个人库上下文。"""
    root = data_root() / _USERS_DIR / user_id
    return VaultContext(
        root=root,
        frankie_dir=root / ".frankie",
        wiki_dir=_WIKI_DIR,
        raw_sources_dir=_RAW_SOURCES_DIR,
    )


def ensure_user_dirs(ctx: VaultContext) -> None:
    """首次访问某用户时创建其目录结构。"""
    ctx.wiki_path.mkdir(parents=True, exist_ok=True)
    if ctx.raw_sources_path:
        ctx.raw_sources_path.mkdir(parents=True, exist_ok=True)
    ctx.frankie_dir.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# 用户身份
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class UserIdentity:
    """已验证的用户身份（认证系统的唯一输出）。"""

    user_id: str
    display_name: str = ""
    role: str = "student"  # "admin" | "student"

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


class InvalidUserIdError(ValueError):
    """user_id 含非法字符。"""


def _validate_user_id(user_id: str) -> str:
    if not _USER_ID_PATTERN.fullmatch(user_id):
        raise InvalidUserIdError(f"非法的用户标识：{user_id!r}")
    return user_id


def _role_of(user_id: str) -> str:
    """角色判定：settings.toml [auth] admin_users 名单内为 admin。"""
    return "admin" if user_id in settings.auth_admin_users else "student"


# ---------------------------------------------------------------------------
# 认证入口（唯一插拔点）
# ---------------------------------------------------------------------------

_DEV_HEADER = "X-Frankie-User"
_DEV_ADMIN_HEADER = "X-Frankie-Dev-Admin"
_DEV_DEFAULT_USER = "demo"


def _is_dev_admin_override(request: Request) -> bool:
    """仅用于本地开发/测试：当请求头显式开启时，强制返回 admin 角色。"""
    value = request.headers.get(_DEV_ADMIN_HEADER, "").strip().lower()
    return value in {"1", "true", "yes", "on"}


def _resolve_user_via_dev_override(request: Request) -> UserIdentity | None:
    """独立的开发测试通道：仅当显式开启调试管理员覆盖时返回 admin 身份。"""
    if not _is_dev_admin_override(request):
        return None

    user_id = request.headers.get(_DEV_HEADER, "").strip() or _DEV_DEFAULT_USER
    user_id = _validate_user_id(user_id)
    return UserIdentity(user_id=user_id, display_name=user_id, role="admin")


def _resolve_user_via_future_school_auth(request: Request) -> UserIdentity | None:
    """预留给后续接入学校统一认证；当前暂不启用。"""
    _ = request
    return None


def _resolve_user_via_dev_provider(request: Request) -> UserIdentity:
    """当前默认的开发联调通道：读取 X-Frankie-User 头并生成身份。"""
    user_id = request.headers.get(_DEV_HEADER, "").strip() or _DEV_DEFAULT_USER
    user_id = _validate_user_id(user_id)
    return UserIdentity(user_id=user_id, display_name=user_id, role=_role_of(user_id))


def resolve_user(request: Request) -> UserIdentity:
    """从请求解析已验证的用户身份。

    认证链路顺序：
      1. 独立开发测试通道（X-Frankie-Dev-Admin）
      2. 未来学校统一认证占位
      3. 当前默认的开发联调通道

    这样后续接入正式认证时，只需要在「未来学校统一认证占位」处替换实现，
    不会破坏现有的本地调试流程。
    """
    dev_override_user = _resolve_user_via_dev_override(request)
    if dev_override_user is not None:
        return dev_override_user

    future_auth_user = _resolve_user_via_future_school_auth(request)
    if future_auth_user is not None:
        return future_auth_user

    return _resolve_user_via_dev_provider(request)
