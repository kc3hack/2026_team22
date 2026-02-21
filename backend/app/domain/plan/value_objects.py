"""
プランドメインの値オブジェクト・ドメインサービス
入力データ（カレンダー予定・睡眠ログ・設定・todayOverride）から署名ハッシュを生成する。
同じ入力なら同じハッシュになり、キャッシュヒット判定に使う。
リストはソートしてからハッシュするため、フロントの送信順に依存しない。
日時文字列は秒単位に正規化するため、ミリ秒やタイムゾーン表記の揺れでハッシュが変わらない。
"""

import hashlib
import json
import re
from typing import Any

# ISO 8601 日時（YYYY-MM-DDTHH:MM:SS の後は .fff や Z 等）にマッチ。秒単位に切り詰めて正規化する
_ISO_DATETIME_RE = re.compile(
    r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})"  # 秒まで
    r"(?:\.\d+)?"  # 省略可能なミリ秒等
    r"(?:Z|[+-]\d{2}:?\d{2})?$"  # Z またはタイムゾーン
)


def _normalize_iso_datetime(s: str) -> str:
    """ISO 8601 日時文字列を秒単位の 'YYYY-MM-DDTHH:MM:SSZ' に正規化する。該当しない場合はそのまま返す。"""
    m = _ISO_DATETIME_RE.match(s.strip())
    if m:
        return m.group(1) + "Z"
    return s


def _canonical_value(v: Any) -> Any:
    """日付・時刻を正規化し、再帰的にキーソート可能な形に揃える。"""
    if v is None or isinstance(v, (bool, int, float)):
        return v
    if isinstance(v, str):
        return _normalize_iso_datetime(v)
    if isinstance(v, (list, tuple)):
        return [_canonical_value(x) for x in v]
    if isinstance(v, dict):
        return {k: _canonical_value(v) for k, v in sorted(v.items())}
    return str(v)


def _sorted_canonical_list(items: list[Any], sort_key: str | None = None) -> list[Any]:
    """
    リストを正規化し、要素の JSON 文字列でソートして返す。
    同じ内容でも並び順が違うとハッシュが変わらないようにする。
    """
    canonical = [_canonical_value(x) for x in items]

    def key_func(x: Any) -> str:
        if sort_key and isinstance(x, dict) and sort_key in x:
            return str(x[sort_key])
        return json.dumps(x, sort_keys=True, ensure_ascii=False)

    canonical.sort(key=key_func)
    return canonical


def build_signature_hash(
    calendar_events: list[Any],
    sleep_logs: list[Any],
    settings: dict[str, Any],
    today_override: dict[str, Any] | None = None,
    today_date: str | None = None,
) -> str:
    """
    カレンダー予定・睡眠ログ・設定・todayOverride・today_date を正規化し、SHA-256 の先頭 64 文字を返す。

    - 辞書はキーソート、リストは内容でソートしてからハッシュ（送信順に依存しない）
    - todayOverride が None の場合も null としてペイロードに含める（ハッシュの一貫性のため）
    - today_date が日付跨ぎでキャッシュを区別するために署名に含まれる
    """
    payload = {
        "calendar_events": _sorted_canonical_list(calendar_events, sort_key="start"),
        "sleep_logs": _sorted_canonical_list(sleep_logs, sort_key="date"),
        "settings": _canonical_value(settings),
        "today_override": _canonical_value(today_override),
        "today_date": today_date or "",
    }
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
