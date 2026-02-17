"""
pytest設定・フィクスチャ
"""

import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    """全テストで同じイベントループを共有（SQLAlchemyのDB接続と整合）"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client() -> AsyncClient:
    """非同期テスト用クライアント（イベントループ整合のため）"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture
def unique_email() -> str:
    """テスト用の一意なメールアドレスを生成"""
    import uuid
    return f"test-{uuid.uuid4().hex[:8]}@example.com"
