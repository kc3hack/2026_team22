"""
GetOrCreatePlanUseCase - 週間睡眠プラン取得
キャッシュヒットなら返却、ミスなら LLM で生成して保存して返す。
force=True の場合はキャッシュを無視して再計算する。
todayOverride を署名ハッシュと LLM 入力に含める。
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.domain.plan.repositories import IPlanCacheRepository
from app.domain.plan.value_objects import build_signature_hash
from app.application.plan.ports import IPlanGenerator
from app.application.base import BaseUseCase

logger = logging.getLogger(__name__)


class GetOrCreatePlanInput:
    """プラン取得の入力"""

    def __init__(
        self,
        user_id: str,
        calendar_events: list[Any],
        sleep_logs: list[Any],
        settings: dict[str, Any],
        today_override: dict[str, Any] | None = None,
        force: bool = False,
    ):
        self.user_id = user_id
        self.calendar_events = calendar_events
        self.sleep_logs = sleep_logs
        self.settings = settings
        self.today_override = today_override
        self.force = force


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
            input.today_override,
        )
        # デバッグ: リクエスト概要と signature_hash をログ（キャッシュ効きの切り分け用）
        logger.info(
            "plan request user_id=%s force=%s signature_hash=%s n_calendar_events=%s n_sleep_logs=%s settings_keys=%s today_override=%s",
            input.user_id[:8] + "..." if len(input.user_id) > 8 else input.user_id,
            input.force,
            signature_hash,
            len(input.calendar_events),
            len(input.sleep_logs),
            list(input.settings.keys()) if input.settings else [],
            input.today_override is not None,
        )

        # force=True でなければキャッシュを検索
        if not input.force:
            cached = await self.cache_repo.get_by_user_and_hash(
                input.user_id, signature_hash
            )
            if cached:
                logger.info("plan cache_hit signature_hash=%s", signature_hash)
                plan = json.loads(cached.plan_json)
                plan["cache_hit"] = True
                return plan

        logger.info("plan cache_miss (or force) signature_hash=%s", signature_hash)
        # キャッシュミス（または force）: LLM で週間プラン生成
        plan = await self.plan_generator.generate_week_plan(
            input.calendar_events,
            input.sleep_logs,
            input.settings,
            today_override=input.today_override,
        )
        plan_json = json.dumps(plan, ensure_ascii=False)

        await self.cache_repo.upsert(
            user_id=input.user_id,
            signature_hash=signature_hash,
            plan_json=plan_json,
        )
        plan["cache_hit"] = False
        return plan
