"""プラン取得 API（認証必須: user_id はトークンから注入）"""

import json
import logging
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.plan import GetOrCreatePlanInput, GetOrCreatePlanUseCase
from app.infrastructure.llm.openrouter_client import OpenRouterClient
from app.infrastructure.persistence.database import get_db
from app.infrastructure.persistence.repositories.sleep_plan_cache_repository import (
    SleepPlanCacheRepository,
)
from app.presentation.dependencies.auth import ensure_current_user
from app.presentation.schemas.plan import PlanRequest

logger = logging.getLogger(__name__)

# デバッグ用: ペイロードログの最大文字数（超えたら省略表示）
PAYLOAD_LOG_MAX_CHARS = 12000

router = APIRouter(prefix="/sleep-plans", tags=["sleep-plans"])


def get_cache_repository(
    db: AsyncSession = Depends(get_db),
) -> SleepPlanCacheRepository:
    return SleepPlanCacheRepository(db)


def get_plan_generator() -> OpenRouterClient:
    return OpenRouterClient()


@router.post("", response_model=dict)
async def get_or_create_plan(
    body: PlanRequest,
    force: bool = Query(False, description="true の場合キャッシュを無視して再計算する"),
    user_id: str = Depends(ensure_current_user),
    cache_repo: SleepPlanCacheRepository = Depends(get_cache_repository),
    plan_generator: OpenRouterClient = Depends(get_plan_generator),
):
    """
    週間睡眠プランを取得または生成する。
    同じ入力ならキャッシュを返し、違う入力なら LLM で生成してキャッシュに保存して返す。
    認証必須。user_id はトークンから確定される。
    force=true の場合はキャッシュを無視して再計算する。
    todayOverride を含む場合、署名ハッシュと LLM 入力に反映される。
    """
    # デバッグ: フロントから受信したペイロードをログ（キャッシュ・ハッシュ差分確認用）
    try:
        payload_json = json.dumps(body.model_dump(), ensure_ascii=False, default=str)
        if len(payload_json) <= PAYLOAD_LOG_MAX_CHARS:
            logger.info("plan request payload (from frontend): %s", payload_json)
        else:
            logger.info(
                "plan request payload (from frontend, truncated): %s ... (truncated, total %d chars)",
                payload_json[:PAYLOAD_LOG_MAX_CHARS],
                len(payload_json),
            )
    except Exception as e:
        logger.warning("plan request payload log failed: %s", e)

    today_date = body.today_date or date.today().isoformat()

    logger.info(
        "POST /sleep-plans request len(calendar_events)=%s len(sleep_logs)=%s force=%s today_date=%s",
        len(body.calendar_events),
        len(body.sleep_logs),
        force,
        today_date,
    )
    usecase = GetOrCreatePlanUseCase(cache_repo, plan_generator)
    input_data = GetOrCreatePlanInput(
        user_id=user_id,
        calendar_events=body.calendar_events,
        sleep_logs=body.sleep_logs,
        settings=body.settings,
        today_override=body.today_override.model_dump() if body.today_override else None,
        today_date=today_date,
        force=force,
    )
    plan = await usecase.execute(input_data)
    logger.info(
        "POST /sleep-plans response cache_hit=%s",
        plan.get("cache_hit", False),
    )
    return plan
