"""
Alembic の実行時環境。
app の Base とモデルを読み込み、DATABASE_URL を同期用に変換して使用する。
"""

from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from alembic import context

from app.config import settings
from app.infrastructure.persistence.database import Base
import app.infrastructure.persistence.models  # noqa: F401 - metadata 登録

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 同期用 URL（Alembic は同期エンジンのため postgresql:// + psycopg2 に変換）
database_url = settings.DATABASE_URL
if "+asyncpg" in database_url:
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://", 1)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """オフラインモード: SQL を生成するだけ"""
    url = database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """オンラインモード: DB に接続してマイグレーション実行"""
    connectable = create_engine(
        database_url,
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
