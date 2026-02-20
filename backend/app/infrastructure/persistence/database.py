"""
データベース接続設定
開発環境: PostgreSQL (Docker)
本番環境: Supabase PostgreSQL
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """SQLAlchemy モデルの基底クラス"""

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """データベースセッションを取得する Dependency"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    データベースの初期化。
    テーブルは Alembic マイグレーションで管理する。
    """
    pass
