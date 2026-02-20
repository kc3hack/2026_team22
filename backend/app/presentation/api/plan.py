"""プラン取得 API（認証必須: user_id はトークンから注入）"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.plan import GetOrCreatePlanInput, GetOrCreatePlanUseCase
from app.infrastructure.llm.openrouter_client import OpenRouterClient
from app.infrastructure.persistence.database import get_db
from app.infrastructure.persistence.repositories.sleep_plan_cache_repository import (
    SleepPlanCacheRepository,
)
from app.presentation.dependencies.auth import get_current_user_id
from app.presentation.schemas.plan import PlanRequest

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
    user_id: str = Depends(get_current_user_id),
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
    usecase = GetOrCreatePlanUseCase(cache_repo, plan_generator)
    input_data = GetOrCreatePlanInput(
        user_id=user_id,
        calendar_events=body.calendar_events,
        sleep_logs=body.sleep_logs,
        settings=body.settings,
        today_override=body.today_override.model_dump() if body.today_override else None,
        force=force,
    )
    plan = await usecase.execute(input_data)
    return plan
