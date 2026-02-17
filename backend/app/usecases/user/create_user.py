"""
CreateUserUseCase - ユーザー作成のビジネスロジック
"""

from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate
from app.repositories.user_repository import UserRepository
from app.usecases.base import BaseUseCase


class CreateUserUseCase(BaseUseCase[UserCreate, User]):
    """ユーザー作成UseCase"""

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, input: UserCreate) -> User:
        """
        ユーザーを作成する
        
        Raises:
            HTTPException: メールアドレスが既に存在する場合
        """
        # ビジネスルール: メールアドレスの重複チェック
        if await self.user_repo.exists_by_email(input.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="このメールアドレスは既に使用されています",
            )

        # ユーザー作成
        user = User(
            email=input.email,
            name=input.name,
        )

        return await self.user_repo.create(user)
