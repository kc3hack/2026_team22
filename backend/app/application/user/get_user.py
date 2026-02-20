"""
GetUserUseCase / GetAllUsersUseCase - ユーザー取得のビジネスロジック
"""

from typing import Sequence

from fastapi import HTTPException, status

from app.domain.user.repositories import IUserRepository
from app.application.base import BaseUseCase, NoInputUseCase


class GetUserUseCase(BaseUseCase[str, object]):
    """ユーザー取得 UseCase（ID 指定）"""

    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    async def execute(self, user_id: str) -> object:
        """
        ID でユーザーを取得する

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


class GetAllUsersUseCase(NoInputUseCase[Sequence[object]]):
    """ユーザー一覧取得 UseCase"""

    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    async def execute(self) -> Sequence[object]:
        """全ユーザーを取得する"""
        return await self.user_repo.get_all()
