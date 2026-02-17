"""
アプリケーション設定
環境変数から設定を読み込み、開発/本番環境を切り替え
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


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
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/sleepsupport"

    # Supabase設定 (本番環境用)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # CORS設定
    CORS_ORIGINS: list[str] = ["http://localhost:8081", "http://localhost:19006"]

    class Config:
        env_file = (".env", "../.env")  # backend/ または プロジェクトルート
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """設定のシングルトンインスタンスを取得"""
    return Settings()


settings = get_settings()
