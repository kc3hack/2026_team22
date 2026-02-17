"""
データベース接続設定
開発環境: PostgreSQL (Docker)
本番環境: Supabase PostgreSQL
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# 非同期エンジンを作成
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

# 非同期セッションファクトリ
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """SQLAlchemyモデルの基底クラス"""
    pass


async def get_db() -> AsyncSession:
    """
    データベースセッションを取得するDependency
    
    Usage:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """データベースの初期化（テーブル作成）"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
