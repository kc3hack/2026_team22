"""
UpdateUserUseCase - ユーザー更新のビジネスロジック
"""

from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserUpdate
from app.repositories.user_repository import UserRepository
from app.usecases.base import BaseUseCase


class UpdateUserUseCase(BaseUseCase[tuple[str, UserUpdate], User]):
    """ユーザー更新UseCase"""

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, input: tuple[str, UserUpdate]) -> User:
        """ユーザーを更新する"""
        user_id, data = input

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません",
            )

        if data.name is not None:
            user.name = data.name

        return await self.user_repo.update(user)
