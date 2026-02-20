"""
SleepPlanCacheRepository の統合テスト（実 DB 接続）
"""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.user import User
from app.infrastructure.persistence.repositories.sleep_plan_cache_repository import (
    SleepPlanCacheRepository,
)


class TestSleepPlanCacheRepository:
    """キャッシュの取得・upsert が DB で正しく動くか"""

    @pytest.fixture
    def repo(self, db_session: AsyncSession) -> SleepPlanCacheRepository:
        return SleepPlanCacheRepository(db_session)

    @pytest.fixture
    async def user_id(self, db_session: AsyncSession) -> str:
        """テスト用ユーザーを 1 件作成"""
        uid = str(uuid.uuid4())
        user = User(
            id=uid,
            email=f"plan-test-{uid[:8]}@example.com",
            name="PlanTestUser",
        )
        db_session.add(user)
        await db_session.flush()
        return uid

    async def test_upsert_creates_then_updates(
        self, repo: SleepPlanCacheRepository, user_id: str
    ):
        """初回 upsert で INSERT、同 user_id で再度 upsert で UPDATE になる"""
        plan_v1 = '{"week_plan": [{"day": "月曜", "advice": "v1"}]}'
        row1 = await repo.upsert(
            user_id=user_id,
            signature_hash="hash_aaa",
            plan_json=plan_v1,
        )
        assert row1.user_id == user_id
        assert row1.signature_hash == "hash_aaa"
        assert row1.plan_json == plan_v1

        plan_v2 = '{"week_plan": [{"day": "火曜", "advice": "v2"}]}'
        row2 = await repo.upsert(
            user_id=user_id,
            signature_hash="hash_bbb",
            plan_json=plan_v2,
        )
        assert row2.user_id == user_id
        assert row2.signature_hash == "hash_bbb"
        assert row2.plan_json == plan_v2

        got = await repo.get_by_user_id(user_id)
        assert got is not None
        assert got.plan_json == plan_v2

    async def test_get_by_user_and_hash_hit_and_miss(
        self, repo: SleepPlanCacheRepository, user_id: str
    ):
        """get_by_user_and_hash で一致時は取得、不一致時は None"""
        await repo.upsert(
            user_id=user_id,
            signature_hash="sig_123",
            plan_json='{"week_plan": []}',
        )

        hit = await repo.get_by_user_and_hash(user_id, "sig_123")
        assert hit is not None
        assert hit.signature_hash == "sig_123"

        miss = await repo.get_by_user_and_hash(user_id, "sig_999")
        assert miss is None

        miss_user = await repo.get_by_user_and_hash("other-user-id", "sig_123")
        assert miss_user is None
