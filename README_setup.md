# SleepSupportApp - 睡眠支援アプリ

照度・騒音センサーとAIを活用し、就寝前の環境モニタリングから起床アラームまでを一貫してサポートするAndroidアプリです。バックエンド（FastAPI + PostgreSQL）と Supabase 認証でユーザーごとの設定・プラン・ログを管理します。

## 機能

### アプリ（フロントエンド）

- **認証** — Supabase Auth によるログイン・サインアップ。未認証時はログインへリダイレクト
- **ホーム** — 今夜の就寝予定時刻、モニタリング状態、直近の睡眠スコア、今日の睡眠プラン、朝の振り返り（気分記録）
- **睡眠プラン** — バックエンドの LLM（OpenRouter）が生成する週間睡眠プラン（7日分）の表示・日別詳細
- **睡眠モニター** — 就寝時刻に合わせた監視の開始/停止。照度・騒音の計測、使用時間追跡、フェーズ表示（準備中 → 就寝前 → 睡眠中）、環境スコアの算出
- **照度センサー** — リアルタイム照度計測（フォアグラウンド）。Android では画面オフ時も計測可能なバックグラウンド計測（Development Build 必須）
- **睡眠ログ** — 過去の睡眠準備スコアの履歴、週間トレンドチャート、スコア内訳表示
- **アラーム** — Gentle / Strict フェーズでの起床アラーム、スヌーズ、オプションで「ミッション」（カメラで指定ターゲットを撮影して止める）
- **設定（プロフィール）** — 起床時刻・睡眠時間・就寝予定の設定、今日だけの時刻オーバーライド、アラームミッションの有無・ターゲット。バックエンドと同期（GET/PUT）。ログアウト

### バックエンド（API）

- **認証** — Supabase JWT 検証によるユーザー識別
- **ユーザー** — CRUD（作成・取得・更新・削除）
- **睡眠プラン** — OpenRouter 経由の LLM で週間プラン生成・キャッシュ（`/api/v1/sleep-plans`）
- **設定** — 就寝・起床時刻などのユーザー設定の取得・更新（`/api/v1/settings`）
- **睡眠ログ** — スコア・メモ・気分の一覧・登録・更新（`/api/v1/sleep-logs`）
- **ヘルス** — `/api/v1/health`・`/api/v1/health/db` で API/DB の稼働確認

## 技術スタック

### フロントエンド（モバイル）

| カテゴリ       | 技術 |
| -------------- | ---- |
| フレームワーク | React Native (Expo SDK 54) |
| 言語           | TypeScript（strict mode） |
| ルーティング   | Expo Router（ファイルベース） |
| 状態管理       | Zustand（グローバル）/ React Hooks（ローカル） |
| 認証           | Supabase Auth（@supabase/supabase-js） |
| センサー       | expo-sensors（照度）、react-native-background-actions（バックグラウンド照度・Android）、useNoiseSensor（音声入力による騒音検知） |
| メディア・通知 | expo-camera、expo-av、expo-notifications |
| ビルド         | expo-dev-client（Development Build）、EAS 対応 |

### バックエンド

| カテゴリ     | 技術 |
| ------------ | ---- |
| フレームワーク | FastAPI |
| 言語         | Python 3.11+ |
| スキーマ・設定 | Pydantic / pydantic-settings |
| ORM・DB      | SQLAlchemy 2（async）、asyncpg、Alembic（マイグレーション） |
| 認証         | Supabase JWT 検証（pyjwt） |
| LLM          | OpenRouter API（httpx） |
| パッケージ管理 | uv |

### インフラ・開発

| カテゴリ   | 技術 |
| ---------- | ---- |
| コンテナ   | Docker / Docker Compose（開発: API + PostgreSQL） |
| 認証・ローカル | Supabase CLI（ローカル Auth / Studio） |
| タスク実行 | Taskfile（dev-up / dev-up-emulator / テスト等） |

## セットアップ

### 前提条件

- **Node.js 18以上**
- **pnpm**（Node.js 16.13+ では `corepack enable` で有効化。または `npm install -g pnpm` でインストール）
- **Task**（[Taskfile](https://taskfile.dev/) の CLI。`brew install go-task` または https://taskfile.dev/installation を参照）
- **Docker Desktop**（バックエンド・Supabase ローカル用）
- **Supabase CLI**（`pnpm install` で devDependencies に含まれる。`pnpm supabase start` 用）
- **Android Studio**（エミュレーター使用時）。エミュレータまたは実機のいずれかが必要
- **Java 17**（Android ビルド用。`brew install --cask temurin@17` でインストール可能）

### Android SDK 環境変数の設定

エミュレーターや実機デバッグを使用する場合、Android SDKの環境変数設定が必要です。

#### Mac / Linux

`~/.zshrc` または `~/.bashrc` に以下を追加：

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

設定後、ターミナルを再起動するか `source ~/.zshrc` を実行。

#### Windows

1. **設定** → **システム** → **詳細情報** → **システムの詳細設定** → **環境変数**
2. **ユーザー環境変数** で **新規**：
   - 変数名: `ANDROID_HOME`
   - 値: `C:\Users\<ユーザー名>\AppData\Local\Android\Sdk`
3. **Path** を編集して以下を追加：
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`

#### 設定確認

```bash
adb --version
```

バージョンが表示されればOKです。

### インストール

```bash
# pnpm を有効化（初回のみ）
corepack enable

# 依存関係のインストール
pnpm install

# 環境変数（任意。LLM・Google Calendar 等を使う場合）
cp .env.example .env
# .env を編集して API キー等を設定

# 環境チェック（初回におすすめ）
pnpm run setup
```

**Android ビルドには Java 17 が必須です。** 未導入の場合は `brew install --cask temurin@17` でインストールしてください。Task の `dev-up` / `dev-up-emulator` / `expo-android` は自動で Java 17 を使用します。

### 環境変数の設定（任意）

LLM（OpenRouter）や Google Calendar 連携を使う場合は、`.env` に設定してください。照度センサーや認証のみ使う場合は Supabase の値は **task dev-up / dev-up-emulator 実行時にローカル用に自動で渡る**ため、本番用でなければ空のままで問題ありません。

| 変数名                     | 説明                              | 必須 |
| -------------------------- | --------------------------------- | ---- |
| `OPENROUTER_API_KEY`       | OpenRouter API キー               | 任意 |
| `OPENROUTER_MODEL`         | 使用モデル（例: openai/gpt-4o-mini） | 任意 |
| `GOOGLE_CLIENT_ID`         | Google OAuth クライアントID       | 任意 |
| `GOOGLE_CLIENT_SECRET`     | Google OAuth クライアントシークレット | 任意 |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` 等 | 本番用 Supabase。開発時は task がローカル値を渡す | 本番時 |

### 開発環境の起動（推奨: Task 利用）

**アプリ＋バックエンド＋Supabase を一括で立ち上げて Android で動かす**場合は、次のいずれかを使います。

| 接続先       | コマンド | 事前準備 |
| ------------ | -------- | -------- |
| **実機**     | `task dev-up` | 実機を USB 接続し、PC と同一 Wi‑Fi |
| **エミュレータ** | `task dev-up-emulator` | エミュレータを起動しておく |

実行内容: Supabase ローカル起動 → Docker（API + DB）起動 → マイグレーション → `.env.expo.local` 更新 → Android ビルド＆起動。**Wi‑Fi を変えたら実機の場合は `task dev-up` を再実行**してください。

**エミュレータで「Network request failed」が出る場合**は、Metro を止めてから `task dev-up-emulator` をやり直してください。詳しくは [docs/troubleshooting-emulator-network.md](docs/troubleshooting-emulator-network.md) を参照。

**アプリのコードだけ変更してビルドし直すとき**は、環境はそのままで:

```bash
task expo-android
```

**Expo 開発サーバー（Metro）だけ起動する**場合は、別ターミナルで:

```bash
task expo-start
# または
pnpm start
```

Expo の**ローカル用**環境変数（Supabase URL や `EXPO_PUBLIC_API_URL`）は **`.env.expo.local`** に格納され、`task dev-up` / `task dev-up-emulator` 実行時に **scripts/write-expo-env.mjs** で自動更新されます。詳細は [docs/phase0/dev-up-and-expo.md](docs/phase0/dev-up-and-expo.md) を参照。

### バックグラウンド光センサー

Android では画面オフ時も照度を計測する **バックグラウンド計測** に対応しています。利用には **Expo Development Build が必須**で、Expo Go では動作しません。使用方法・技術仕様・トラブルシューティング等の詳細は [docs/light-sensor-background.md](docs/light-sensor-background.md) を参照してください。

## プロジェクト構成

FSD Lite（Feature-Sliced Design の簡易版）を採用しています。

```
SleepSupportApp/
├── app/                          # Expo Router（ルーティング定義のみ）
│   ├── (auth)/                   # 認証フロー
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # タブナビゲーション
│   │   ├── _layout.tsx           # タブ設定（未認証時はログインへ）
│   │   ├── index.tsx             # ホーム
│   │   ├── sleep-plan.tsx        # 睡眠プラン
│   │   ├── sleep-monitor.tsx     # 睡眠モニター
│   │   ├── sleep-log.tsx         # 睡眠ログ
│   │   └── profile.tsx          # 設定（睡眠設定・ログアウト）
│   └── _layout.tsx               # Root Layout
│
├── src/
│   ├── features/                 # 機能単位のモジュール（主戦場）
│   │   ├── auth/                 # 認証（ログイン・サインアップ）
│   │   ├── home/                 # ホーム画面
│   │   ├── sleep-plan/           # 週間睡眠プラン（API連携）
│   │   ├── sleep-monitor/        # 睡眠監視（照度・騒音・フェーズ・スコア）
│   │   ├── sleep-log/            # 睡眠ログ・トレンド
│   │   ├── sleep-settings/       # 睡眠設定（就寝・起床・ミッション等）
│   │   ├── sleep-schedule/       # 就寝スケジュール・アドバイス
│   │   ├── light-sensor/         # 照度センサー（フォア/バックグラウンド）
│   │   ├── alarm/                # アラーム・ミッション（カメラ）
│   │   └── ...
│   │
│   └── shared/                   # アプリ全体で共有
│       ├── components/           # 汎用UI（WheelPicker 等）
│       ├── constants/            # 定数（テーマカラー等）
│       ├── lib/                  # API クライアント、Supabase、LLM、Google Calendar
│       └── types/                # 共通型定義
│
├── backend/                      # FastAPI + PostgreSQL（別節で記載）
├── assets/
└── app.json / app.config.js      # Expo 設定
```

詳細なアーキテクチャについては [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

## Task 一覧（Taskfile）

開発時の主な操作は **Task** で揃えています。`task --list` で一覧表示できます。

| タスク | 説明 |
| ------ | ------ |
| `task dev-up` | **実機用** — Supabase + Docker + マイグレーション + .env.expo.local 更新 + Android ビルド＆起動 |
| `task dev-up-emulator` | **エミュレータ用** — 上記と同様（API URL を 10.0.2.2 に設定） |
| `task dev-down` | docker-compose と Supabase を停止 |
| `task metro-stop` | Metro（ポート 8081）を停止（env をやり直す前に推奨） |
| `task expo-start` | Expo 開発サーバー起動（`pnpm start` と同じ） |
| `task expo-android` | Android でビルド＆起動のみ（環境構築済みのとき） |
| `task supabase-start` | Supabase ローカルのみ起動 |
| `task supabase-stop` | Supabase ローカルのみ停止 |
| `task test` | バックエンドのテスト（DB は起動済みであること） |
| `task test:db` | DB を起動してからバックエンドのテストを実行 |
| `task pre-commit` | コミット前チェック（lint-staged） |
| `task pre-push` | push 前チェック（保護ブランチ警告） |

## バックエンド (Docker)

バックエンドは FastAPI + PostgreSQL で構成されています。**Supabase は認証（Auth）専用**で、アプリのテーブル（users, sleep_plan_cache 等）は **別の PostgreSQL**（開発時は docker-compose の DB）で管理します。

### 前提条件

- Docker Desktop（または Docker Engine + Docker Compose）

### バックエンドの起動

**通常の開発では `task dev-up` または `task dev-up-emulator` が Docker も起動する**ため、単体でバックエンドだけ動かす場合のみ以下を使います。

```bash
# 環境変数を Supabase ローカル用に渡して起動（task dev-up 内でも同様のことを実行）
eval "$(node scripts/supabase-env-for-compose.mjs)" && docker-compose up -d --build

# ログを見ながら起動
eval "$(node scripts/supabase-env-for-compose.mjs)" && docker-compose up

# 停止
docker-compose down

# データも含めて完全に削除
docker-compose down -v
```

### エンドポイント

| URL                                    | 説明                       |
| -------------------------------------- | -------------------------- |
| http://localhost:8000                  | APIルート                  |
| http://localhost:8000/api/docs         | Swagger UI（開発環境のみ） |
| http://localhost:8000/api/redoc        | ReDoc（開発環境のみ）      |
| http://localhost:8000/api/v1/health    | ヘルスチェック             |
| http://localhost:8000/api/v1/health/db | DBヘルスチェック           |

### 本番環境

本番環境では `docker-compose.prod.yml` を使用し、Supabase Cloudに接続します。

```bash
# 本番用設定で起動
docker-compose -f docker-compose.prod.yml up -d
```

`.env` に以下を設定してください：

```
ENV=production
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

### DB マイグレーション（Alembic）

テーブルは **Alembic** で管理しています。**task dev-up** / **task dev-up-emulator** 実行時に `alembic upgrade head` が自動で走り、マイグレーションが適用されます。

```bash
# 手動でマイグレーションのみ実行する場合（DB 起動後。ポートは .env の DB_PORT に合わせる）
cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:${DB_PORT:-5432}/sleepsupport uv run alembic upgrade head
```

新規テーブル追加時は `alembic revision --autogenerate -m "説明"` でリビジョンを作成し、`alembic upgrade head` で適用してください。

### バックエンドのローカル開発（uv）

Pythonパッケージ管理に [uv](https://docs.astral.sh/uv/) を使用しています。

```bash
# uv のインストール（未導入の場合）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 依存関係のインストール
cd backend && uv sync

# テスト実行（単体〜統合）
# 統合テスト（DB 利用）を含める場合: リポジトリルートで task test:db（DB を起動してから実行）
# DB 起動済みなら: リポジトリルートで task test、または backend 内で:
uv run pytest tests/ -v
```

### バックエンドのディレクトリ構成

```
backend/
├── app/
│   ├── main.py           # FastAPIエントリーポイント
│   ├── config.py         # 設定（環境変数読み込み）
│   ├── database.py       # DB接続設定
│   ├── models/           # SQLAlchemyモデル
│   ├── repositories/     # データアクセス層
│   ├── routers/          # APIルーター
│   ├── schemas/          # Pydanticスキーマ（入出力DTO）
│   └── usecases/         # ビジネスロジック層
├── scripts/
│   └── test-crud.sh      # CRUD手動テストスクリプト
├── tests/                # pytest
├── pyproject.toml        # プロジェクト設定・依存関係（uv）
├── uv.lock               # ロックファイル
├── pytest.ini
├── Dockerfile
└── init.sql              # DB初期化SQL
```

## 開発ルール

### コーディング規約

- ESLintとPrettierで自動フォーマット
- TypeScriptの厳格モード有効
- コミット前にlint-stagedで自動チェック
- **Push 前に pre-push フックでブランチチェック**（`main` / `master` への直接 push はブロック。feature ブランチで push すること）

### ブランチ戦略

- `main` - 本番環境用
- `develop` - 開発統合ブランチ
- `feature/*` - 機能開発ブランチ
- `fix/*` - バグ修正ブランチ

### コミットメッセージ規約

```
<type>: <subject>

例:
feat: 照度センサーのリアルタイム表示機能を追加
fix: センサー停止時のメモリリークを修正
docs: READMEにセットアップ手順を追加
```

タイプ:

- `feat` - 新機能
- `fix` - バグ修正
- `docs` - ドキュメント
- `style` - フォーマット変更
- `refactor` - リファクタリング
- `test` - テスト追加
- `chore` - ビルド・設定変更

## 困ったときは

| 症状                             | 対処法                                                                 |
| -------------------------------- | ---------------------------------------------------------------------- |
| `pnpm` が動かない                | `corepack enable` を実行                                               |
| Node のバージョンが合わない      | `.nvmrc` 参照。nvm なら `nvm use`                                      |
| 起動がおかしい・エラーが出る     | `pnpm run reset` でリセット                                            |
| 開発環境を止めたい               | `task dev-down`（Docker + Supabase 停止）                              |
| エミュレータで Network request failed | まず `task metro-stop` してから `task dev-up-emulator` を再実行。 [docs/troubleshooting-emulator-network.md](docs/troubleshooting-emulator-network.md) 参照 |
| Metro のキャッシュが怪しい       | `pnpm run start:clear` でキャッシュクリア起動                           |
| コミットが通らない               | `pnpm run lint:fix` と `pnpm run format` を実行                        |
| push がブロックされる            | 保護ブランチ（main/master）への直接 push は `task pre-push` でブロック。feature ブランチで push すること |

## 注意事項

- 照度センサーはAndroidデバイスでのみ利用可能です
- iOSおよびWebでは照度センサーは動作しません
- 実機でテストすることを推奨します

## ライセンス

Private

## チームメンバー

- （チームメンバーを追加してください）
