"""
プランドメインの値オブジェクト・ドメインサービス
入力データ（カレンダー予定・睡眠ログ・設定・todayOverride）から署名ハッシュを生成する。
同じ入力なら同じハッシュになり、キャッシュヒット判定に使う。
"""

import hashlib
import json
from typing import Any


def _canonical_value(v: Any) -> Any:
    """日付・時刻を ISO8601 に揃え、再帰的にキーソート可能な形に正規化する"""
    if v is None or isinstance(v, (bool, int, float)):
        return v
    if isinstance(v, str):
        return v
    if isinstance(v, (list, tuple)):
        return [_canonical_value(x) for x in v]
    if isinstance(v, dict):
        return {k: _canonical_value(v) for k, v in sorted(v.items())}
    return str(v)


def build_signature_hash(
    calendar_events: list[Any],
    sleep_logs: list[Any],
    settings: dict[str, Any],
    today_override: dict[str, Any] | None = None,
) -> str:
    """
    カレンダー予定・睡眠ログ・設定・todayOverride を正規化し、SHA-256 の先頭 64 文字を返す。

    - 順序に依存しないようキーソートした JSON でシリアライズ
    - 日付・時刻は文字列化して一意に扱う
    - todayOverride が None の場合も null としてペイロードに含める（ハッシュの一貫性のため）
    """
    payload = {
        "calendar_events": _canonical_value(calendar_events),
        "sleep_logs": _canonical_value(sleep_logs),
        "settings": _canonical_value(settings),
        "today_override": _canonical_value(today_override),
    }
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
