"""
ユーザーリポジトリのポート（インターフェース）
Infrastructure 層がこのインターフェースを実装する。
"""

from collections.abc import Sequence
from typing import Protocol


class IUserRepository(Protocol):
    """ユーザーリポジトリポート"""

    async def get_by_id(self, id: str) -> object | None:
        """IDで1件取得"""
        ...

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[object]:
        """全件取得（ページネーション付き）"""
        ...

    async def get_by_email(self, email: str) -> object | None:
        """メールアドレスでユーザーを取得"""
        ...

    async def exists_by_email(self, email: str) -> bool:
        """メールアドレスの存在チェック"""
        ...

    async def create_user(self, email: str, name: str) -> object:
        """新規作成"""
        ...

    async def update(self, user: object) -> object:
        """更新"""
        ...

    async def delete(self, user: object) -> None:
        """削除"""
        ...
