"""
GetUserUseCase - ユーザー取得のビジネスロジック
"""

from typing import Sequence
from fastapi import HTTPException, status

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.usecases.base import BaseUseCase, NoInputUseCase


class GetUserUseCase(BaseUseCase[str, User]):
    """ユーザー取得UseCase（ID指定）"""

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, user_id: str) -> User:
        """
        IDでユーザーを取得する
        
        Raises:
            HTTPException: ユーザーが見つからない場合
        """
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません",
            )

        return user


class GetAllUsersUseCase(NoInputUseCase[Sequence[User]]):
    """ユーザー一覧取得UseCase"""

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self) -> Sequence[User]:
        """全ユーザーを取得する"""
        return await self.user_repo.get_all()
