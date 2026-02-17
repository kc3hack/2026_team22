"""
Repository基底クラス
データアクセスの共通処理を定義
"""

from typing import Generic, TypeVar, Type, Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """
    Repository基底クラス
    
    Usage:
        class UserRepository(BaseRepository[User]):
            def __init__(self, db: AsyncSession):
                super().__init__(User, db)
    """

    def __init__(self, model: Type[ModelT], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: str) -> Optional[ModelT]:
        """IDで1件取得"""
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[ModelT]:
        """全件取得（ページネーション付き）"""
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(self, obj: ModelT) -> ModelT:
        """新規作成"""
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: ModelT) -> ModelT:
        """更新"""
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: ModelT) -> None:
        """削除"""
        await self.db.delete(obj)
        await self.db.flush()
