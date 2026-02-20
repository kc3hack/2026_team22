"""
UseCase 基底クラス
ビジネスロジックの共通インターフェースを定義
"""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

InputT = TypeVar("InputT")
OutputT = TypeVar("OutputT")


class BaseUseCase(ABC, Generic[InputT, OutputT]):
    """UseCase 基底クラス。各 UseCase は execute メソッドを実装する。"""

    @abstractmethod
    async def execute(self, input: InputT) -> OutputT:
        """UseCase のメイン処理"""
        pass


class NoInputUseCase(ABC, Generic[OutputT]):
    """入力なしの UseCase 基底クラス"""

    @abstractmethod
    async def execute(self) -> OutputT:
        """UseCase のメイン処理"""
        pass
