"""
UpdateUserUseCase - ユーザー更新のビジネスロジック
"""

from typing import Any

from fastapi import HTTPException, status

from app.application.base import BaseUseCase
from app.domain.user.repositories import IUserRepository


class UpdateUserUseCase(BaseUseCase[tuple[str, dict], Any]):
    """ユーザー更新 UseCase"""

    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    async def execute(self, input: tuple[str, dict]) -> Any:
        """
        ユーザーを更新する

        input: (user_id, {"name": str | None})
        """
        user_id, data = input

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません",
            )

        if data.get("name") is not None:
            setattr(user, "name", data["name"])

        return await self.user_repo.update(user)
