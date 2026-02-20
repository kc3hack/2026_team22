"""
プランリポジトリのポート（インターフェース）
Infrastructure 層がこのインターフェースを実装する。
"""

from typing import Protocol


class PlanCacheRecord(Protocol):
    """キャッシュレコードのプロトコル（plan_json を持つ）"""

    plan_json: str


class IPlanCacheRepository(Protocol):
    """週間睡眠プランキャッシュのリポジトリポート"""

    async def get_by_user_and_hash(
        self, user_id: str, signature_hash: str
    ) -> PlanCacheRecord | None:
        """user_id と signature_hash が一致するキャッシュを1件取得"""
        ...

    async def get_by_user_id(self, user_id: str) -> PlanCacheRecord | None:
        """user_id で1件取得（1ユーザー1行のため）"""
        ...

    async def upsert(
        self, user_id: str, signature_hash: str, plan_json: str
    ) -> PlanCacheRecord:
        """同一 user_id の行を上書き（なければ INSERT）"""
        ...
