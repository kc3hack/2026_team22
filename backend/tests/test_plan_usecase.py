"""
GetOrCreatePlanUseCase の単体テスト（リポジトリ・LLM をモック）
todayOverride, force, cache_hit の振る舞いを検証する。
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

        assert result["week_plan"] == cached_plan["week_plan"]
        assert result["cache_hit"] is True
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

        assert result["week_plan"] == llm_plan["week_plan"]
        assert result["cache_hit"] is False
        mock_cache_repo.get_by_user_and_hash.assert_called_once()
        mock_cache_repo.upsert.assert_called_once()
        kwargs = mock_cache_repo.upsert.call_args[1]
        assert kwargs["user_id"] == "user-001"
        assert kwargs["signature_hash"]
        assert '"week_plan"' in kwargs["plan_json"]

    async def test_force_skips_cache(self, mock_cache_repo, mock_plan_generator):
        """force=True の場合はキャッシュを検索せず LLM を呼ぶ"""
        llm_plan = {"week_plan": [{"day": "月曜", "advice": "強制再生成"}]}
        mock_plan_generator.generate_week_plan = AsyncMock(return_value=llm_plan)

        input_data = GetOrCreatePlanInput(
            user_id="user-001",
            calendar_events=[],
            sleep_logs=[],
            settings={},
            force=True,
        )

        usecase = GetOrCreatePlanUseCase(mock_cache_repo, mock_plan_generator)
        result = await usecase.execute(input_data)

        assert result["week_plan"] == llm_plan["week_plan"]
        assert result["cache_hit"] is False
        # force=True なのでキャッシュ検索は行われない
        mock_cache_repo.get_by_user_and_hash.assert_not_called()
        mock_cache_repo.upsert.assert_called_once()

    async def test_today_override_in_settings_passed_to_generator(self, mock_cache_repo, mock_plan_generator):
        """settings 内の today_override が LLM ジェネレータに渡されること"""
        mock_cache_repo.get_by_user_and_hash.return_value = None
        llm_plan = {"week_plan": [{"day": "月曜", "advice": "オーバーライド反映"}]}
        mock_plan_generator.generate_week_plan = AsyncMock(return_value=llm_plan)

        override = {
            "date": "2026-02-20",
            "sleepHour": 23,
            "sleepMinute": 30,
            "wakeHour": 7,
            "wakeMinute": 0,
        }
        input_data = GetOrCreatePlanInput(
            user_id="user-001",
            calendar_events=[],
            sleep_logs=[],
            settings={"today_override": override},
        )

        usecase = GetOrCreatePlanUseCase(mock_cache_repo, mock_plan_generator)
        await usecase.execute(input_data)

        call_args = mock_plan_generator.generate_week_plan.call_args
        settings = call_args[0][2]  # 3番目の位置引数
        assert settings.get("today_override") == override

    async def test_today_date_passed_to_generator(self, mock_cache_repo, mock_plan_generator):
        """today_date が LLM ジェネレータに渡されること"""
        mock_cache_repo.get_by_user_and_hash.return_value = None
        llm_plan = {"week_plan": [{"date": "2026-02-20", "advice": "テスト"}]}
        mock_plan_generator.generate_week_plan = AsyncMock(return_value=llm_plan)

        input_data = GetOrCreatePlanInput(
            user_id="user-001",
            calendar_events=[],
            sleep_logs=[],
            settings={},
            today_date="2026-02-20",
        )

        usecase = GetOrCreatePlanUseCase(mock_cache_repo, mock_plan_generator)
        await usecase.execute(input_data)

        call_kwargs = mock_plan_generator.generate_week_plan.call_args[1]
        assert call_kwargs["today_date"] == "2026-02-20"

    async def test_today_override_in_settings_changes_signature(self, mock_cache_repo, mock_plan_generator):
        """settings 内の today_override が異なると署名ハッシュも変わる"""
        mock_cache_repo.get_by_user_and_hash.return_value = None
        llm_plan = {"week_plan": []}
        mock_plan_generator.generate_week_plan = AsyncMock(return_value=llm_plan)

        usecase = GetOrCreatePlanUseCase(mock_cache_repo, mock_plan_generator)

        input_no_override = GetOrCreatePlanInput(
            user_id="user-001",
            calendar_events=[],
            sleep_logs=[],
            settings={},
        )
        await usecase.execute(input_no_override)
        hash_no_override = mock_cache_repo.get_by_user_and_hash.call_args[0][1]

        mock_cache_repo.reset_mock()
        mock_plan_generator.reset_mock()
        mock_cache_repo.get_by_user_and_hash.return_value = None
        mock_plan_generator.generate_week_plan = AsyncMock(return_value=llm_plan)

        input_with_override = GetOrCreatePlanInput(
            user_id="user-001",
            calendar_events=[],
            sleep_logs=[],
            settings={
                "today_override": {
                    "date": "2026-02-20",
                    "sleepHour": 23,
                    "sleepMinute": 0,
                    "wakeHour": 7,
                    "wakeMinute": 0,
                }
            },
        )
        await usecase.execute(input_with_override)
        hash_with_override = mock_cache_repo.get_by_user_and_hash.call_args[0][1]

        assert hash_no_override != hash_with_override
