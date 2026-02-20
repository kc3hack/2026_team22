"""
データベース接続（Infrastructure 層への再エクスポート）
後方互換のため app.database から参照できるようにする。
"""

from app.infrastructure.persistence.database import (
    AsyncSessionLocal,
    Base,
    engine,
    get_db,
    init_db,
)

__all__ = ["AsyncSessionLocal", "Base", "engine", "get_db", "init_db"]
