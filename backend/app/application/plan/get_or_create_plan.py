"""
GetOrCreatePlanUseCase - 週間睡眠プラン取得
キャッシュヒットなら返却、ミスなら LLM で生成して保存して返す。
"""

from __future__ import annotations

import json
from typing import Any

from app.domain.plan.repositories import IPlanCacheRepository
from app.domain.plan.value_objects import build_signature_hash
from app.application.plan.ports import IPlanGenerator
from app.application.base import BaseUseCase


class GetOrCreatePlanInput:
    """プラン取得の入力"""

    def __init__(
        self,
        user_id: str,
        calendar_events: list[Any],
        sleep_logs: list[Any],
        settings: dict[str, Any],
    ):
        self.user_id = user_id
        self.calendar_events = calendar_events
        self.sleep_logs = sleep_logs
        self.settings = settings


class GetOrCreatePlanUseCase(BaseUseCase[GetOrCreatePlanInput, dict[str, Any]]):
    """週間睡眠プランを取得または生成する UseCase"""

    def __init__(
        self,
        cache_repo: IPlanCacheRepository,
        plan_generator: IPlanGenerator,
    ):
        self.cache_repo = cache_repo
        self.plan_generator = plan_generator

    async def execute(self, input: GetOrCreatePlanInput) -> dict[str, Any]:
        signature_hash = build_signature_hash(
            input.calendar_events,
            input.sleep_logs,
            input.settings,
        )

        # キャッシュヒット
        cached = await self.cache_repo.get_by_user_and_hash(
            input.user_id, signature_hash
        )
        if cached:
            return json.loads(cached.plan_json)

        # キャッシュミス: LLM で週間プラン生成
        plan = await self.plan_generator.generate_week_plan(
            input.calendar_events,
            input.sleep_logs,
            input.settings,
        )
        plan_json = json.dumps(plan, ensure_ascii=False)

        await self.cache_repo.upsert(
            user_id=input.user_id,
            signature_hash=signature_hash,
            plan_json=plan_json,
        )
        return plan
