"""
アプリケーション設定
環境変数から設定を読み込み、開発/本番環境を切り替え
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """アプリケーション設定"""

    # 環境設定
    ENV: str = "development"  # development | production
    DEBUG: bool = True

    # API設定
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api/v1"

    # データベース設定
    # 開発環境: ローカルPostgreSQL (docker-compose)
    # 本番環境: Supabase PostgreSQL
    # 注: alembic 実行時に postgresql:// が渡っても、create_async_engine 用に postgresql+asyncpg:// に変換する
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/sleepsupport"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def ensure_async_driver(cls, v: str) -> str:
        """postgresql:// が渡された場合、create_async_engine 用に postgresql+asyncpg:// に変換"""
        if v and v.startswith("postgresql://") and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Supabase設定 (本番環境用)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # CORS設定（環境変数はカンマ区切り文字列で渡す。list のままでも可）
    CORS_ORIGINS: str | list[str] = ["http://localhost:8081", "http://localhost:19006"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return []

    # OpenRouter（LLM）設定
    # https://openrouter.ai/docs
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"  # 無料枠: deepseek/deepseek-chat-v3-0324:free 等

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),  # backend/ または プロジェクトルート
        env_file_encoding="utf-8",
        extra="ignore",  # API_URL, DB_PORT 等の未定義環境変数を無視（Taskfile / docker-compose 用）
    )


@lru_cache()
def get_settings() -> Settings:
    """設定のシングルトンインスタンスを取得"""
    return Settings()


settings = get_settings()
