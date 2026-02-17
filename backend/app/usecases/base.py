"""
UseCase基底クラス
ビジネスロジックの共通インターフェースを定義
"""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic

InputT = TypeVar("InputT")
OutputT = TypeVar("OutputT")


class BaseUseCase(ABC, Generic[InputT, OutputT]):
    """
    UseCase基底クラス
    
    各UseCaseは execute メソッドを実装する
    
    Usage:
        class CreateUserUseCase(BaseUseCase[CreateUserInput, User]):
            def __init__(self, user_repo: UserRepository):
                self.user_repo = user_repo
            
            async def execute(self, input: CreateUserInput) -> User:
                # ビジネスロジック
                user = User(name=input.name, email=input.email)
                return await self.user_repo.create(user)
    """

    @abstractmethod
    async def execute(self, input: InputT) -> OutputT:
        """UseCaseのメイン処理"""
        pass


class NoInputUseCase(ABC, Generic[OutputT]):
    """
    入力なしのUseCase基底クラス
    
    Usage:
        class GetAllUsersUseCase(NoInputUseCase[list[User]]):
            async def execute(self) -> list[User]:
                return await self.user_repo.get_all()
    """

    @abstractmethod
    async def execute(self) -> OutputT:
        """UseCaseのメイン処理"""
        pass
