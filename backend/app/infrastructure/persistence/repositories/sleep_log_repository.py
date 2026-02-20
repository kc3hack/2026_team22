"""
SleepLogRepository 実装（ISleepLogRepository のアダプター）
"""

from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.sleep_log import SleepLog


class SleepLogRepository:
    """睡眠ログのリポジトリ実装"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: str, limit: int = 7) -> list[SleepLog]:
        """user_id のログを日付降順で取得"""
        result = await self.db.execute(
            select(SleepLog)
            .where(SleepLog.user_id == user_id)
            .order_by(SleepLog.date.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id(self, log_id: str, user_id: str) -> SleepLog | None:
        """id と user_id で 1 件取得"""
        result = await self.db.execute(
            select(SleepLog).where(
                SleepLog.id == log_id,
                SleepLog.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        user_id: str,
        log_date: date,
        score: int,
        scheduled_sleep_time: datetime | None = None,
        usage_penalty: int = 0,
        environment_penalty: int = 0,
        phase1_warning: bool = False,
        phase2_warning: bool = False,
        light_exceeded: bool = False,
        noise_exceeded: bool = False,
        mood: int | None = None,
    ) -> SleepLog:
        """睡眠ログを新規作成"""
        row = SleepLog(
            user_id=user_id,
            date=log_date,
            score=score,
            scheduled_sleep_time=scheduled_sleep_time,
            usage_penalty=usage_penalty,
            environment_penalty=environment_penalty,
            phase1_warning=phase1_warning,
            phase2_warning=phase2_warning,
            light_exceeded=light_exceeded,
            noise_exceeded=noise_exceeded,
            mood=mood,
        )
        self.db.add(row)
        await self.db.flush()
        await self.db.refresh(row)
        return row

    async def update_mood(self, log_id: str, user_id: str, mood: int) -> SleepLog | None:
        """指定ログの気分を更新"""
        row = await self.get_by_id(log_id, user_id)
        if row is None:
            return None
        row.mood = mood
        await self.db.flush()
        await self.db.refresh(row)
        return row
