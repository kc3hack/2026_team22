"""
CreateUserUseCase - ユーザー作成のビジネスロジック
"""

from fastapi import HTTPException, status

from app.domain.user.repositories import IUserRepository
from app.application.base import BaseUseCase


class CreateUserUseCase(BaseUseCase[dict, object]):
    """ユーザー作成 UseCase"""

    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    async def execute(self, input: dict) -> object:
        """
        ユーザーを作成する

        input: {"email": str, "name": str}

        Raises:
            HTTPException: メールアドレスが既に存在する場合
        """
        email = input["email"]
        name = input["name"]

        if await self.user_repo.exists_by_email(email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="このメールアドレスは既に使用されています",
            )

        return await self.user_repo.create_user(email=email, name=name)
