"""
pytest設定・フィクスチャ
"""

import asyncio

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.database import (
    AsyncSessionLocal,
    Base,
    engine,
)
from app.main import app as fastapi_app
from app.presentation.dependencies.auth import get_current_user_id

# 全モデルを Base.metadata に登録
import app.infrastructure.persistence.models  # noqa: F401

# テスト用の固定 user_id（認証オーバーライドで使用）
TEST_USER_ID = "11111111-1111-1111-1111-111111111111"


@pytest.fixture(autouse=True)
def _override_auth():
    """認証必須 API のテスト用: get_current_user_id を固定 ID でオーバーライド"""
    fastapi_app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID
    yield
    fastapi_app.dependency_overrides.pop(get_current_user_id, None)


@pytest.fixture(scope="session")
def event_loop():
    """全テストで同じイベントループを共有（SQLAlchemyのDB接続と整合）"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def _ensure_db_tables(event_loop):
    """統合テスト用: テストセッション開始時にテーブルが存在するようにする（マイグレーション未適用のDB向け）"""
    async def create_all():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    try:
        event_loop.run_until_complete(create_all())
    except Exception:
        # DB が起動していない場合はスキップ（単体テストは DB 不要）
        import warnings
        warnings.warn("DB connection failed. Integration tests will be skipped.")


@pytest.fixture
async def client() -> AsyncClient:
    """非同期テスト用クライアント（イベントループ整合のため）"""
    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture
def unique_email() -> str:
    """テスト用の一意なメールアドレスを生成"""
    import uuid
    return f"test-{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture
async def db_session() -> AsyncSession:
    """DB 接続を使う統合テスト用セッション（テスト終了後にロールバック）"""
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()
