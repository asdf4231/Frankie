import pytest

from frankie import web


@pytest.mark.asyncio
async def test_api_balance_uses_local_llm_module(monkeypatch):
    import frankie.llm as local_llm

    def fake_fetch_balance() -> dict:
        return {"available": True, "total_balance": "10.00", "currency": "CNY"}

    monkeypatch.setattr(local_llm, "fetch_balance", fake_fetch_balance)

    result = await web.api_balance()

    assert result["available"] is True
    assert result["total_balance"] == "10.00"
