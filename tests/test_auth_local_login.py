from fastapi.testclient import TestClient

from frankie import web


def test_seeded_default_user_can_login_and_change_password(tmp_path, monkeypatch):
    monkeypatch.setattr(web.settings, "frankie_data_dir", tmp_path / "data", raising=False)
    monkeypatch.setattr(web.settings, "auth_admin_users", ["zhangjunnan1224"], raising=False)
    monkeypatch.setenv("FRANKIE_AUTH_SECRET", "test-secret-key")

    client = TestClient(web.app)

    login = client.post(
        "/api/auth/login",
        json={"user_id": "36020251155156", "password": "36020251155156"},
    )
    assert login.status_code == 200, login.text
    payload = login.json()
    assert payload["user_id"] == "36020251155156"
    assert payload["role"] == "student"
    assert client.cookies.get("frankie_session")

    change = client.post(
        "/api/auth/change-password",
        json={"old_password": "36020251155156", "new_password": "NewPass!123"},
    )
    assert change.status_code == 200, change.text
    assert change.json()["ok"] is True

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 200, logout.text
    assert logout.json()["ok"] is True


def test_seeded_admin_user_can_login(tmp_path, monkeypatch):
    monkeypatch.setattr(web.settings, "frankie_data_dir", tmp_path / "data", raising=False)
    monkeypatch.setattr(web.settings, "auth_admin_users", ["zhangjunnan1224"], raising=False)
    monkeypatch.setenv("FRANKIE_AUTH_SECRET", "test-secret-key")

    client = TestClient(web.app)
    login = client.post(
        "/api/auth/login",
        json={"user_id": "zhangjunnan1224", "password": "zhangjunnan1224"},
    )

    assert login.status_code == 200, login.text
    assert login.json()["role"] == "admin"
