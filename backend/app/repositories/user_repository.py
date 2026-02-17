"""
UserRepository（データアクセス層）
"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """ユーザーリポジトリ"""

    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        """メールアドレスでユーザーを取得"""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def exists_by_email(self, email: str) -> bool:
        """メールアドレスの存在チェック"""
        user = await self.get_by_email(email)
        return user is not None
