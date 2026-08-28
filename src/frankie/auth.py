"""认证边界层（多用户，生产可用本地登录）。

此项目不再依赖学校统一认证；系统使用本地账号体系进行登录、会话和密码修改。

认证链路：
    HTTP 请求 → resolve_user(request) → UserIdentity → VaultContext → 业务逻辑

部署时需要设置环境变量 FRANKIE_AUTH_SECRET，用于签名 cookie 会话。
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from dataclasses import dataclass
from pathlib import Path

from fastapi import Request

from frankie.config import VaultContext, settings

# ---------------------------------------------------------------------------
# 数据目录布局
# ---------------------------------------------------------------------------
# {FRANKIE_DATA_DIR}/
# ├── auth/                   本地认证存储（users.json）
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
_AUTH_DIR = "auth"
_WIKI_DIR = "frankie-wiki"
_RAW_SOURCES_DIR = "frankie-wiki/raw"
_SESSION_COOKIE_NAME = "frankie_session"
_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60
SESSION_COOKIE_NAME = _SESSION_COOKIE_NAME

# user_id 允许字符（学号/工号；含中文名兼容）
_USER_ID_PATTERN = re.compile(r"[A-Za-z0-9_\-.一-鿿]{1,64}")


def data_root() -> Path:
    """多用户数据根目录（FRANKIE_DATA_DIR，默认 ./data）。"""
    return settings.frankie_data_dir


def auth_store_path() -> Path:
    """返回本地认证存储文件路径。"""
    root = data_root() / _AUTH_DIR
    root.mkdir(parents=True, exist_ok=True)
    return root / "users.json"


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
# 本地认证存储
# ---------------------------------------------------------------------------

_SEED_USERS = (
    ("zhangjunnan1224", "zhangjunnan1224", "admin"),
    ("36020251155156", "36020251155156", "student"),
)


def _auth_secret() -> str:
    secret = settings.auth_secret.strip() if getattr(settings, "auth_secret", "") else ""
    if secret:
        return secret
    return os.getenv("FRANKIE_AUTH_SECRET", "frankie-local-dev-secret-change-me")


def _hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 200_000)
    return salt, base64.b64encode(digest).decode("ascii")


def _load_auth_store() -> dict:
    path = auth_store_path()
    if not path.exists():
        return {"users": {}}
    try:
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        if isinstance(data, dict) and isinstance(data.get("users"), dict):
            return data
    except (OSError, ValueError):
        pass
    return {"users": {}}


def _save_auth_store(data: dict) -> None:
    path = auth_store_path()
    with path.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2, sort_keys=True)
        fh.write("\n")


def ensure_seed_user() -> None:
    """确保部署所需的管理员和学生账号存在。"""
    store = _load_auth_store()
    users = store.setdefault("users", {})
    changed = False
    allowed_ids = {user_id for user_id, _, _ in _SEED_USERS}
    for user_id in tuple(users):
        if user_id not in allowed_ids:
            del users[user_id]
            changed = True
    for user_id, password, role in _SEED_USERS:
        user = users.get(user_id)
        if user is None:
            salt, pwd_hash = _hash_password(password)
            users[user_id] = {
                "user_id": user_id,
                "display_name": user_id,
                "role": role,
                "password_salt": salt,
                "password_hash": pwd_hash,
                "must_change_password": False,
            }
            changed = True
            continue
        if user.get("role") != role:
            user["role"] = role
            changed = True
        if user.get("display_name") is None:
            user["display_name"] = user_id
            changed = True
    if changed:
        _save_auth_store(store)


def _get_user_record(user_id: str) -> dict | None:
    ensure_seed_user()
    store = _load_auth_store()
    return store.get("users", {}).get(user_id)


def _verify_password(record: dict, password: str) -> bool:
    salt = record.get("password_salt")
    expected = record.get("password_hash")
    if not salt or not expected:
        return False
    _, actual = _hash_password(password, salt)
    return hmac.compare_digest(actual, expected)


def authenticate_user(user_id: str, password: str) -> UserIdentity | None:
    """校验账号密码，返回已验证用户。"""
    user_id = _validate_user_id(user_id.strip())
    record = _get_user_record(user_id)
    if record is None:
        return None
    if not _verify_password(record, password):
        return None
    role = record.get("role", _role_of(user_id))
    display_name = record.get("display_name") or user_id
    return UserIdentity(user_id=user_id, display_name=display_name, role=role)


def set_user_password(user_id: str, new_password: str) -> None:
    """更新用户密码，并保存到本地存储。"""
    user_id = _validate_user_id(user_id)
    store = _load_auth_store()
    users = store.setdefault("users", {})
    record = users.get(user_id)
    if record is None:
        raise ValueError(f"用户不存在：{user_id}")
    salt, pwd_hash = _hash_password(new_password)
    record["password_salt"] = salt
    record["password_hash"] = pwd_hash
    record["must_change_password"] = False
    _save_auth_store(store)


def make_session_token(user_id: str) -> str:
    """签名会话 cookie。"""
    payload = {
        "user_id": user_id,
        "exp": int(time.time()) + _SESSION_TTL_SECONDS,
        "iat": int(time.time()),
    }
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    signature = hmac.new(_auth_secret().encode("utf-8"), payload_json.encode("utf-8"), hashlib.sha256).hexdigest()
    encoded = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("ascii").rstrip("=")
    return f"{encoded}.{signature}"


def verify_session_token(token: str | None) -> str | None:
    """校验 cookie 会话并返回 user_id，失效时返回 None。"""
    if not token:
        return None
    try:
        payload_part, signature = token.split(".", 1)
    except ValueError:
        return None

    padding = "=" * (-len(payload_part) % 4)
    try:
        payload_data = base64.urlsafe_b64decode((payload_part + padding).encode("ascii"))
        payload = json.loads(payload_data.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None

    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    expected = hmac.new(_auth_secret().encode("utf-8"), payload_json.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None

    exp = int(payload.get("exp", 0))
    if exp < int(time.time()):
        return None
    user_id = payload.get("user_id")
    if not isinstance(user_id, str):
        return None
    return _validate_user_id(user_id)


# ---------------------------------------------------------------------------
# 认证入口（唯一插拔点）
# ---------------------------------------------------------------------------

def _resolve_user_via_session_cookie(request: Request) -> UserIdentity | None:
    """优先使用签名 cookie 会话，用于真实生产登录。"""
    token = request.cookies.get(_SESSION_COOKIE_NAME)
    user_id = verify_session_token(token)
    if user_id is None:
        return None
    record = _get_user_record(user_id)
    if record is None:
        return None
    return UserIdentity(
        user_id=user_id,
        display_name=record.get("display_name") or user_id,
        role=record.get("role", _role_of(user_id)),
    )


def resolve_user(request: Request) -> UserIdentity:
    """从请求解析已验证的用户身份。"""
    session_user = _resolve_user_via_session_cookie(request)
    if session_user is not None:
        return session_user

    raise InvalidUserIdError("未登录或会话已失效")
