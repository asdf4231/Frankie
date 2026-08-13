from __future__ import annotations

from frankie.auth import resolve_user


class DummyRequest:
    def __init__(self, headers: dict[str, str]) -> None:
        self.headers = headers


def test_dev_admin_header_grants_admin_role() -> None:
    request = DummyRequest({
        "X-Frankie-User": "teacher01",
        "X-Frankie-Dev-Admin": "1",
    })

    user = resolve_user(request)

    assert user.user_id == "teacher01"
    assert user.role == "admin"
