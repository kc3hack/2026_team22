# バックエンド実装ガイド（AI 向け）

このドキュメントは、**AI（Cursor / Copilot 等）がバックエンドを正しく編集・拡張するため**の手順と規約をまとめたものです。実装前に必ず読んでください。

---

## 1. Issue をチェックアウトして実装する

バックエンドの作業は **GitHub Issue 単位**で行う。実装を始めるときは次の手順に従う。

1. **Issue 一覧を確認する**  
   - リポジトリの Issues で、`[Phase1]` / `[Phase2]` / `[Phase3]` などのラベルやタイトルで該当する Issue を探す。  
   - 実装計画に対応する Issue は `docs/implementation-plan.md` のチェックリスト（1.1, 1.2, 2.1 等）と対応している（例: Issue #18 = 1.1 認証ミドルウェア）。

2. **実装する Issue を 1 つ選び、内容を把握する**  
   - ブラウザで Issue を開くか、GitHub CLI で `gh issue view <番号>` を実行する。  
   - Issue の「目的」「成果物」「依存」「参照」を読み、`docs/backend-design.md` や `docs/implementation-plan.md` の該当節を確認する。

3. **Issue 用のブランチを切る**  
   - 例: `git checkout -b fix/issue-18-auth-middleware`（Issue 番号と内容が分かる名前にする）。  
   - GitHub CLI で Issue と紐づけたブランチを作る場合: `gh issue develop 18 --base main --checkout`（番号は適宜変更）。

4. **Issue の「成果物」に沿って実装する**  
   - 本 README の §2 以降（ディレクトリ構成・ビルド・実装の流れ）に従う。  
   - 完了したら **`task test`** でテストが通ることを確認する。

5. **コミット・PR で Issue を参照する**  
   - コミットメッセージや PR の説明に `Closes #18` のように書くと、マージ時に Issue が自動で閉じる。  
   - 例: `git commit -m "feat(auth): 認証ミドルウェアを追加 Closes #18"`

**AI への指示の例（ユーザーがチャットで書くとき）**:  
「Issue #20 をチェックアウトして実装して。`backend/IMPLEMENT_README.md` の手順に従うこと。」

---

## 2. プロジェクト概要

- **スタック**: Python 3.11, FastAPI, SQLAlchemy 2.0（async）, Alembic, Pydantic, uv
- **アーキテクチャ**: オニオン（ドメイン → アプリケーション → インフラ → プレゼンテーション）。依存は内側向きのみ。
- **設計の根拠**: リポジトリルートの `docs/backend-design.md` および `docs/implementation-plan.md` に仕様・ER 図・シーケンス・実装計画がある。新機能はそれに沿って実装する。

---

## 3. ディレクトリ構成

```
backend/
├── app/
│   ├── main.py                 # FastAPI アプリ・ルーター登録・lifespan
│   ├── config.py               # 環境変数（Settings）
│   ├── database.py             # (互換用) init_db 等
│   ├── domain/                 # ドメイン層（エンティティ・リポジトリ interface）
│   │   ├── user/
│   │   └── plan/
│   ├── application/            # ユースケース層（application services）
│   │   ├── user/
│   │   └── plan/
│   ├── infrastructure/         # インフラ層（DB・外部API）
│   │   ├── auth/               # 認証（Supabase JWT 検証）※Phase1
│   │   ├── persistence/       # モデル・リポジトリ実装・database
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   └── database.py
│   │   └── llm/               # LLM クライアント（OpenRouter 等）
│   └── presentation/          # プレゼンテーション層（API）
│       ├── api/               # FastAPI ルーター
│       ├── dependencies/      # 認証 Depends（get_current_user_id）※Phase1
│       └── schemas/           # Pydantic リクエスト・レスポンス
├── alembic/                    # マイグレーション
│   ├── env.py
│   └── versions/
├── tests/                      # pytest（conftest, 統合テスト）
├── pyproject.toml              # 依存・uv 設定
├── Dockerfile                  # 本番・docker-compose 用
└── IMPLEMENT_README.md         # 本ファイル
```

- **新規テーブル**: `app/infrastructure/persistence/models/` にモデルを追加し、`alembic/versions/` にマイグレーションを追加する。
- **新規 API**: ドメインのリポジトリ interface → インフラのリポジトリ実装 → アプリケーションのユースケース → `presentation/schemas/` に Pydantic → `presentation/api/` にルーター。最後に `app/main.py` で `include_router`。

---

## 4. ビルド・実行・テスト（Taskfile とコマンド）

リポジトリルートに **Taskfile** がある。バックエンド関連は以下を使う。

| 目的 | コマンド | 備考 |
|------|----------|------|
| **バックエンドのテスト** | `task test` | リポジトリルートで実行。内部で `dir: backend` かつ `uv run pytest tests/ -v` を実行する。 |
| **開発環境の起動（実機用）** | `task dev-up` | Supabase 起動 → docker-compose up → **backend でマイグレーション**（`cd backend && DATABASE_URL=... uv run alembic upgrade head`）→ Expo 用 .env 更新。 |
| **開発環境の起動（エミュレータ用）** | `task dev-up-emulator` | 上記と同様だが .env の API URL が 10.0.2.2。 |
| **開発環境の停止** | `task dev-down` | docker-compose down, supabase stop。 |
| **Supabase のみ起動** | `task supabase-start` | 認証用。Docker 必須。 |

**backend ディレクトリ内で直接実行する場合**（AI がターミナルで叩くときの例）:

```bash
# 依存のインストール
cd backend && uv sync

# テスト（backend にいる状態で）
uv run pytest tests/ -v

# マイグレーション（DB が起動していること。DATABASE_URL が必要）
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sleepsupport uv run alembic upgrade head

# 新規マイグレーションの生成
uv run alembic revision --autogenerate -m "add_sleep_settings_and_sleep_logs"

# API をローカルで起動（DB が別途起動していること）
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Docker で API と DB をまとめて起動する場合**（リポジトリルートで）:

```bash
# task dev-up が Supabase の環境変数を eval してから docker-compose を叩くため、
# 単体で compose だけ使う場合は:
docker-compose up -d
# その後、マイグレーションは上記の DATABASE_URL で backend 内で alembic upgrade head
```

- **テスト時の DB**: `tests/conftest.py` では `engine` を使い、`Base.metadata.create_all` でテーブルを作成している。`DATABASE_URL` が未設定や別 URL の場合は、環境に応じて PostgreSQL が動いている必要がある（docker-compose の db を使うか、テスト用 URL を conftest で上書きする運用）。

---

## 5. 実装の流れ（新機能を追加するとき）

1. **設計の確認**  
   `docs/backend-design.md` と `docs/implementation-plan.md` で、追加する API・テーブル・署名の仕様を確認する。

2. **モデルとマイグレーション**  
   - `app/infrastructure/persistence/models/` に SQLAlchemy モデルを追加（`Base` を継承）。  
   - `alembic/versions/` にリビジョンを追加。  
   - `uv run alembic revision --autogenerate -m "説明"` で生成し、必要なら手で編集。  
   - `DATABASE_URL` を渡して `uv run alembic upgrade head` で適用。

3. **ドメイン層**  
   - 必要なら `app/domain/<集約>/repositories.py` にリポジトリの **interface（抽象クラス）** を定義。

4. **インフラ層**  
   - `app/infrastructure/persistence/repositories/` にリポジトリの **実装** を追加。  
   - DB セッションは `AsyncSession`、`get_db` で注入する想定。

5. **アプリケーション層**  
   - `app/application/<集約>/` にユースケース（例: `get_or_create_plan.py`）を追加。  
   - リポジトリは依存性注入（FastAPI の `Depends(get_db)` からリポジトリを渡すか、ルーターでインスタンス化）。

6. **プレゼンテーション層**  
   - `app/presentation/schemas/` に Pydantic のリクエスト・レスポンスを定義。  
   - `app/presentation/api/` にルーターを追加。パスは `config.API_PREFIX`（`/api/v1`）を付与。  
   - `app/main.py` で `app.include_router(xxx.router, prefix=settings.API_PREFIX)` で登録。

7. **認証**  
   - 設計では全 API 認証必須。実装時は、ミドルウェア or Depends で `Authorization` からトークン検証し、`user_id` を取得してハンドラに渡す。未認証は 401。

8. **テスト**  
   - `tests/` に統合テストを追加。`conftest.py` の `client` フィクスチャで `AsyncClient` を利用。  
   - 実行: リポジトリルートで **`task test`**、または backend 内で **`uv run pytest tests/ -v`**。

---

## 6. 既存コードの参照

- **プラン API**: `app/presentation/api/plan.py`, `app/application/plan/get_or_create_plan.py`, `app/infrastructure/persistence/repositories/sleep_plan_cache_repository.py`
- **署名ハッシュ**: `app/domain/plan/value_objects.py` の `build_signature_hash`（設計書 §5 に従い、todayOverride を入力に含める）
- **設定**: `app/config.py`（`Settings`）。環境変数は `pydantic-settings` で読み込む。
- **DB 接続**: `app/infrastructure/persistence/database.py`（`engine`, `AsyncSessionLocal`, `get_db`）。

---

## 7. 禁止・推奨

- **禁止**: ドメイン層がインフラやプレゼンテーションに依存すること。依存は常に内側（ドメイン ← アプリケーション ← インフラ ← プレゼンテーション）。
- **推奨**: 新規エンドポイントは設計書の URL・メソッド・Body に合わせる（例: `GET/PUT /api/v1/settings`, `GET/POST/PATCH /api/v1/sleep-logs`, `POST /api/v1/sleep-plans` の Body に todayOverride）。
- **推奨**: マイグレーションは必ず `alembic` で管理し、`Base.metadata.create_all` は本番では使わない（テスト用のみ）。

---

## 8. まとめ

- 仕様は **`docs/backend-design.md`** と **`docs/implementation-plan.md`** を参照する。  
- ビルド・テスト・DB 反映は **Taskfile**（`task test`, `task dev-up`）および **backend 内の `uv` / `alembic`** を使う。  
- 新機能は **Issue をチェックアウトしてから**、**モデル → マイグレーション → リポジトリ → ユースケース → スキーマ → ルーター** の順で実装し、認証を全 API に掛ける。
