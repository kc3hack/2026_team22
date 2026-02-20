"""
GET /api/v1/settings と PUT /api/v1/settings の統合テスト（認証必須）
"""

from httpx import AsyncClient

from app.main import web_app as app
from app.presentation.dependencies.auth import get_current_user_id


class TestSettingsAPIAuth:
    """認証必須の挙動"""

    async def test_get_settings_returns_401_without_authorization(self, client: AsyncClient):
        """Authorization なしで GET /settings すると 401"""
        app.dependency_overrides.pop(get_current_user_id, None)
        try:
            res = await client.get("/api/v1/settings")
            assert res.status_code == 401
        finally:
            app.dependency_overrides[get_current_user_id] = lambda: (
                "11111111-1111-1111-1111-111111111111"
            )

    async def test_put_settings_returns_401_without_authorization(self, client: AsyncClient):
        """Authorization なしで PUT /settings すると 401"""
        app.dependency_overrides.pop(get_current_user_id, None)
        try:
            res = await client.put(
                "/api/v1/settings",
                json={
                    "wake_up_hour": 7,
                    "wake_up_minute": 0,
                    "sleep_duration_hours": 8,
                },
            )
            assert res.status_code == 401
        finally:
            app.dependency_overrides[get_current_user_id] = lambda: (
                "11111111-1111-1111-1111-111111111111"
            )


class TestSettingsAPICRUD:
    """設定の取得・保存（認証オーバーライドで user は作成済み想定）"""

    async def test_get_settings_returns_defaults_when_no_record(
        self, client: AsyncClient, unique_email: str
    ):
        """レコードが無いとき GET はデフォルト値を返す"""
        create_res = await client.post(
            "/api/v1/users",
            json={"email": unique_email, "name": "SettingsTest"},
        )
        assert create_res.status_code == 201
        user_id = create_res.json()["id"]
        app.dependency_overrides[get_current_user_id] = lambda: user_id
        try:
            res = await client.get("/api/v1/settings")
            assert res.status_code == 200
            data = res.json()
            assert data["wake_up_hour"] == 7
            assert data["wake_up_minute"] == 0
            assert data["sleep_duration_hours"] == 8
            assert data["resilience_window_minutes"] == 20
            assert data["mission_enabled"] is False
            assert data["mission_target"] is None
            assert data["preparation_minutes"] == 30
            assert data["ics_url"] is None
            assert data["today_override"] is None
        finally:
            app.dependency_overrides.pop(get_current_user_id, None)

    async def test_put_then_get_settings(self, client: AsyncClient, unique_email: str):
        """PUT で保存 → GET で同じ内容が返る"""
        create_res = await client.post(
            "/api/v1/users",
            json={"email": unique_email, "name": "SettingsPutTest"},
        )
        assert create_res.status_code == 201
        user_id = create_res.json()["id"]
        app.dependency_overrides[get_current_user_id] = lambda: user_id
        try:
            payload = {
                "wake_up_hour": 6,
                "wake_up_minute": 30,
                "sleep_duration_hours": 7,
                "resilience_window_minutes": 15,
                "mission_enabled": True,
                "mission_target": "洗面所",
                "preparation_minutes": 45,
                "ics_url": "https://example.com/calendar.ics",
                "today_override": {
                    "date": "2026-02-20",
                    "sleep_hour": 23,
                    "sleep_minute": 30,
                    "wake_hour": 7,
                    "wake_minute": 0,
                },
            }
            put_res = await client.put("/api/v1/settings", json=payload)
            assert put_res.status_code == 200
            put_data = put_res.json()
            assert put_data["wake_up_hour"] == 6
            assert put_data["wake_up_minute"] == 30
            assert put_data["sleep_duration_hours"] == 7
            assert put_data["resilience_window_minutes"] == 15
            assert put_data["mission_enabled"] is True
            assert put_data["mission_target"] == "洗面所"
            assert put_data["preparation_minutes"] == 45
            assert put_data["ics_url"] == "https://example.com/calendar.ics"
            assert put_data["today_override"] is not None
            assert put_data["today_override"]["date"] == "2026-02-20"
            assert put_data["today_override"]["sleep_hour"] == 23
            assert put_data["today_override"]["wake_hour"] == 7

            get_res = await client.get("/api/v1/settings")
            assert get_res.status_code == 200
            assert get_res.json() == put_data
        finally:
            app.dependency_overrides.pop(get_current_user_id, None)

    async def test_put_then_clear_today_override(self, client: AsyncClient, unique_email: str):
        """today_override を null にして PUT するとオーバーライドが消える"""
        create_res = await client.post(
            "/api/v1/users",
            json={"email": unique_email, "name": "SettingsOverrideTest"},
        )
        assert create_res.status_code == 201
        user_id = create_res.json()["id"]
        app.dependency_overrides[get_current_user_id] = lambda: user_id
        try:
            await client.put(
                "/api/v1/settings",
                json={
                    "wake_up_hour": 7,
                    "wake_up_minute": 0,
                    "sleep_duration_hours": 8,
                    "today_override": {
                        "date": "2026-02-20",
                        "sleep_hour": 23,
                        "sleep_minute": 0,
                        "wake_hour": 7,
                        "wake_minute": 0,
                    },
                },
            )
            get_res = await client.get("/api/v1/settings")
            assert get_res.json()["today_override"] is not None

            await client.put(
                "/api/v1/settings",
                json={
                    "wake_up_hour": 7,
                    "wake_up_minute": 0,
                    "sleep_duration_hours": 8,
                    "today_override": None,
                },
            )
            get_res2 = await client.get("/api/v1/settings")
            assert get_res2.json()["today_override"] is None
        finally:
            app.dependency_overrides.pop(get_current_user_id, None)
