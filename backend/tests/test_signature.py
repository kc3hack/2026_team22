"""
署名ハッシュ生成の単体テスト（DB 不要）
"""

from app.domain.plan.value_objects import build_signature_hash


class TestBuildSignatureHash:
    """build_signature_hash の振る舞い"""

    def test_same_input_produces_same_hash(self):
        """同じ入力なら常に同じハッシュになる"""
        cal = [{"title": "会議", "start": "2026-02-18T10:00:00"}]
        logs = [{"date": "2026-02-17", "hours": 7}]
        settings = {"timezone": "Asia/Tokyo"}
        h1 = build_signature_hash(cal, logs, settings)
        h2 = build_signature_hash(cal, logs, settings)
        assert h1 == h2
        assert len(h1) == 64  # SHA-256 hex

    def test_different_input_produces_different_hash(self):
        """入力が違えばハッシュも違う"""
        h1 = build_signature_hash([], [], {})
        h2 = build_signature_hash([{"a": 1}], [], {})
        h3 = build_signature_hash([], [{"b": 2}], {})
        h4 = build_signature_hash([], [], {"c": 3})
        assert len({h1, h2, h3, h4}) == 4

    def test_dict_key_order_independent(self):
        """辞書のキー順序に依存しない（キーソートされる）"""
        cal1 = [{"z": 1, "a": 2}]
        cal2 = [{"a": 2, "z": 1}]
        h1 = build_signature_hash(cal1, [], {})
        h2 = build_signature_hash(cal2, [], {})
        assert h1 == h2

    def test_list_order_independent(self):
        """リストの要素順に依存しない（ソートしてからハッシュするのでキャッシュが安定する）"""
        cal1 = [
            {"title": "B", "start": "2026-02-19T10:00:00"},
            {"title": "A", "start": "2026-02-18T09:00:00"},
        ]
        cal2 = [
            {"title": "A", "start": "2026-02-18T09:00:00"},
            {"title": "B", "start": "2026-02-19T10:00:00"},
        ]
        logs1 = [{"date": "2026-02-18", "score": 80}, {"date": "2026-02-17", "score": 70}]
        logs2 = [{"date": "2026-02-17", "score": 70}, {"date": "2026-02-18", "score": 80}]
        h_cal1 = build_signature_hash(cal1, [], {})
        h_cal2 = build_signature_hash(cal2, [], {})
        h_logs1 = build_signature_hash([], logs1, {})
        h_logs2 = build_signature_hash([], logs2, {})
        assert h_cal1 == h_cal2
        assert h_logs1 == h_logs2

    def test_empty_input_deterministic(self):
        """空入力でも決定的なハッシュが返る"""
        h = build_signature_hash([], [], {})
        assert len(h) == 64
        assert h == build_signature_hash([], [], {})

    def test_settings_only(self):
        """settings だけでも一意なハッシュ"""
        h1 = build_signature_hash([], [], {"goal_hours": 7})
        h2 = build_signature_hash([], [], {"goal_hours": 8})
        assert h1 != h2

    # --- todayOverride 関連テスト ---

    def test_today_override_changes_hash(self):
        """todayOverride ありとなしでハッシュが変わる"""
        override = {
            "date": "2026-02-20",
            "sleepHour": 23,
            "sleepMinute": 30,
            "wakeHour": 7,
            "wakeMinute": 0,
        }
        h_without = build_signature_hash([], [], {}, today_override=None)
        h_with = build_signature_hash([], [], {}, today_override=override)
        assert h_without != h_with

    def test_today_override_same_produces_same_hash(self):
        """同じ todayOverride なら同じハッシュ"""
        override = {
            "date": "2026-02-20",
            "sleepHour": 23,
            "sleepMinute": 0,
            "wakeHour": 7,
            "wakeMinute": 0,
        }
        h1 = build_signature_hash([], [], {}, today_override=override)
        h2 = build_signature_hash([], [], {}, today_override=override)
        assert h1 == h2

    def test_today_override_different_date_changes_hash(self):
        """todayOverride の date が違えばハッシュも違う"""
        override1 = {
            "date": "2026-02-20",
            "sleepHour": 23,
            "sleepMinute": 0,
            "wakeHour": 7,
            "wakeMinute": 0,
        }
        override2 = {
            "date": "2026-02-21",
            "sleepHour": 23,
            "sleepMinute": 0,
            "wakeHour": 7,
            "wakeMinute": 0,
        }
        h1 = build_signature_hash([], [], {}, today_override=override1)
        h2 = build_signature_hash([], [], {}, today_override=override2)
        assert h1 != h2

    def test_today_override_none_is_deterministic(self):
        """todayOverride=None を明示的に渡しても、省略時と同じハッシュ"""
        h1 = build_signature_hash([], [], {})
        h2 = build_signature_hash([], [], {}, today_override=None)
        assert h1 == h2

    def test_iso_datetime_normalized_same_hash(self):
        """ISO 日時のミリ秒・タイムゾーン表記が違っても同じハッシュになる（キャッシュ安定）"""
        cal1 = [{"title": "A", "start": "2026-02-18T09:00:00.000Z", "end": "2026-02-18T10:00:00Z"}]
        cal2 = [
            {"title": "A", "start": "2026-02-18T09:00:00.123Z", "end": "2026-02-18T10:00:00.000Z"}
        ]
        logs1 = [
            {"date": "2026-02-17", "score": 80, "scheduled_sleep_time": "2026-02-17T23:00:00Z"}
        ]
        logs2 = [
            {"date": "2026-02-17", "score": 80, "scheduled_sleep_time": "2026-02-17T23:00:00.456Z"}
        ]
        h_cal1 = build_signature_hash(cal1, [], {})
        h_cal2 = build_signature_hash(cal2, [], {})
        h_logs1 = build_signature_hash([], logs1, {})
        h_logs2 = build_signature_hash([], logs2, {})
        assert h_cal1 == h_cal2
        assert h_logs1 == h_logs2
