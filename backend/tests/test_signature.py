"""
署名ハッシュ生成の単体テスト（DB 不要）
"""

import pytest

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
