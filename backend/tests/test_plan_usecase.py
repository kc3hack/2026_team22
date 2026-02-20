"""
GetOrCreatePlanUseCase の単体テスト（リポジトリ・LLM をモック）
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.plan import (
    GetOrCreatePlanInput,
    GetOrCreatePlanUseCase,
)


class TestGetOrCreatePlanUseCase:
    """UseCase のキャッシュヒット/ミスと LLM 呼び出し"""

    @pytest.fixture
    def mock_cache_repo(self):
        return AsyncMock()

    @pytest.fixture
    def mock_plan_generator(self):
        return AsyncMock()

    @pytest.fixture
    def sample_input(self):
        return GetOrCreatePlanInput(
            user_id="user-001",
            calendar_events=[],
            sleep_logs=[],
            settings={},
        )

    async def test_cache_hit_returns_cached_plan(
        self, mock_cache_repo, mock_plan_generator, sample_input
    ):
        """同一ハッシュでキャッシュがある場合はそのプランを返す（LLM は呼ばない）"""
        cached_plan = {"week_plan": [{"day": "月曜", "advice": "キャッシュ"}]}
        mock_row = MagicMock()
        mock_row.plan_json = '{"week_plan": [{"day": "月曜", "advice": "キャッシュ"}]}'
        mock_cache_repo.get_by_user_and_hash.return_value = mock_row

        usecase = GetOrCreatePlanUseCase(mock_cache_repo, mock_plan_generator)
        result = await usecase.execute(sample_input)

        assert result == cached_plan
        mock_cache_repo.get_by_user_and_hash.assert_called_once()
        mock_cache_repo.upsert.assert_not_called()
        mock_plan_generator.generate_week_plan.assert_not_called()

    async def test_cache_miss_calls_llm_and_upserts(
        self, mock_cache_repo, mock_plan_generator, sample_input
    ):
        """キャッシュがない場合は LLM を呼び、結果を保存して返す"""
        mock_cache_repo.get_by_user_and_hash.return_value = None
        llm_plan = {"week_plan": [{"day": "月曜", "advice": "LLM生成"}]}
        mock_plan_generator.generate_week_plan = AsyncMock(return_value=llm_plan)

        usecase = GetOrCreatePlanUseCase(mock_cache_repo, mock_plan_generator)
        result = await usecase.execute(sample_input)

        assert result == llm_plan
        mock_cache_repo.get_by_user_and_hash.assert_called_once()
        mock_cache_repo.upsert.assert_called_once()
        kwargs = mock_cache_repo.upsert.call_args[1]
        assert kwargs["user_id"] == "user-001"
        assert kwargs["signature_hash"]
        assert '"week_plan"' in kwargs["plan_json"]
