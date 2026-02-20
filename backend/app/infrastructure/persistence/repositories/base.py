"""
Repository 基底クラス（Infrastructure 層）
"""

from collections.abc import Sequence
from typing import Any, Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.database import Base

ModelT = TypeVar("ModelT", bound=Base)


def _id_column(model: type[Base]) -> Any:
    """ORM モデルの id カラムを取得（mypy 用に切り出し）"""
    return getattr(model, "id")


class BaseRepository(Generic[ModelT]):
    """Repository 基底クラス"""

    def __init__(self, model: type[ModelT], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: str) -> ModelT | None:
        """ID で 1 件取得"""
        id_col = _id_column(self.model)
        result = await self.db.execute(select(self.model).where(id_col == id))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[ModelT]:
        """全件取得（ページネーション付き）"""
        result = await self.db.execute(select(self.model).offset(skip).limit(limit))
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
