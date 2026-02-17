# SleepSupportApp Backend Dockerfile
# バックエンドのDockerイメージの作り方
# docker-compose がこれを元にコンテナをビルド・起動する
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

# システム依存（PostgreSQL クライアント）
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 本番用: 開発依存を除外
ENV UV_NO_DEV=1
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# 依存関係を先にインストール（レイヤーキャッシュ最適化）
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project

# アプリケーションコードをコピー
COPY ./app ./app

# プロジェクトを同期（依存は既に入っているので高速）
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000

ENTRYPOINT []
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
