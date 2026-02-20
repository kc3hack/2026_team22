"""
DeleteUserUseCase - ユーザー削除のビジネスロジック
"""

from fastapi import HTTPException, status

from app.application.base import BaseUseCase
from app.domain.user.repositories import IUserRepository


class DeleteUserUseCase(BaseUseCase[str, None]):
    """ユーザー削除 UseCase"""

    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    async def execute(self, user_id: str) -> None:
        """ユーザーを削除する"""
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません",
            )

        await self.user_repo.delete(user)
