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
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def exists_by_email(self, email: str) -> bool:
        """メールアドレスの存在チェック"""
        user = await self.get_by_email(email)
        return user is not None

    async def create_user(self, email: str, name: str) -> User:
        """新規ユーザー作成"""
        user = User(email=email, name=name)
        return await self.create(user)

    async def ensure_user_exists(self, user_id: str) -> None:
        """
        認証済み user_id に対応する users 行が存在することを保証する。
        存在しなければ id=user_id で 1 件挿入する（Supabase Auth の uid と整合させるため）。
        """
        existing = await self.get_by_id(user_id)
        if existing is not None:
            return
        # 同一 id で Supabase Auth と紐づく行を挿入（email は unique のためプレースホルダー）
        user = User(
            id=user_id,
            email=f"auth-{user_id}@placeholder.local",
            name="ユーザー",
        )
        await self.create(user)
