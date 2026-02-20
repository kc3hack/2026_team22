"""
UserRepository 実装（IPlanCacheRepository のアダプター）
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.user import User
from app.infrastructure.persistence.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """ユーザーリポジトリ実装"""

    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        """メールアドレスでユーザーを取得"""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def exists_by_email(self, email: str) -> bool:
        """メールアドレスの存在チェック"""
        user = await self.get_by_email(email)
        return user is not None

    async def create_user(self, email: str, name: str) -> User:
        """新規ユーザー作成"""
        user = User(email=email, name=name)
        return await self.create(user)
