"""
SleepPlanCacheRepository 実装（IPlanCacheRepository のアダプター）
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.sleep_plan_cache import SleepPlanCache


class SleepPlanCacheRepository:
    """週間睡眠プランキャッシュのリポジトリ実装"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_and_hash(
        self, user_id: str, signature_hash: str
    ) -> SleepPlanCache | None:
        """user_id と signature_hash が一致するキャッシュを 1 件取得"""
        result = await self.db.execute(
            select(SleepPlanCache).where(
                SleepPlanCache.user_id == user_id,
                SleepPlanCache.signature_hash == signature_hash,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: str) -> SleepPlanCache | None:
        """user_id で 1 件取得（1 ユーザー 1 行のため）"""
        result = await self.db.execute(
            select(SleepPlanCache).where(SleepPlanCache.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self, user_id: str, signature_hash: str, plan_json: str
    ) -> SleepPlanCache:
        """同一 user_id の行を上書き（なければ INSERT）"""
        row = await self.get_by_user_id(user_id)
        if row:
            row.signature_hash = signature_hash
            row.plan_json = plan_json
            await self.db.flush()
            await self.db.refresh(row)
            return row
        row = SleepPlanCache(
            user_id=user_id,
            signature_hash=signature_hash,
            plan_json=plan_json,
        )
        self.db.add(row)
        await self.db.flush()
        await self.db.refresh(row)
        return row
