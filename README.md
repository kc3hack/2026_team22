# SleepSupportApp - 睡眠支援アプリ

照度センサーを活用した睡眠環境をサポートするAndroidアプリです。

## 機能

- 照度センサーによるリアルタイム照度計測
- 睡眠環境スコアの算出
- 睡眠に最適な環境かどうかの判定
- 改善アドバイスの表示

## 技術スタック

- React Native (Expo)
- TypeScript
- expo-sensors (照度センサー)

## セットアップ

### 前提条件

- Node.js 18以上
- pnpm（Node.js 16.13+ では `corepack enable` で有効化。または `npm install -g pnpm` でインストール）
- Android Studio（エミュレーター使用時）
- Expo Go アプリ（実機テスト用）

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
# pnpmを有効化（初回のみ、Node.jsに同梱のCorepackを使用）
corepack enable

# 依存関係のインストール
pnpm install

# 環境チェック（初回におすすめ）
pnpm run setup

# Huskyの初期化（初回のみ）
pnpm run prepare
```

### 環境変数の設定（任意）

LLM連携やGoogle Calendar連携を使用する場合は、環境変数を設定してください。

```bash
# .env.example をコピーして .env を作成
cp .env.example .env

# .env を編集してAPIキーを設定
```

| 変数名                 | 説明                                     | 必須 |
| ---------------------- | ---------------------------------------- | ---- |
| `LLM_API_KEY`          | LLMサービスのAPIキー（OpenAI, Gemini等） | 任意 |
| `LLM_MODEL`            | 使用するLLMモデル名（デフォルト: gpt-4） | 任意 |
| `GOOGLE_CLIENT_ID`     | Google OAuth クライアントID              | 任意 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット    | 任意 |

> **Note**: これらの機能は現在実装予定です。照度センサー機能のみを使う場合は環境変数の設定は不要です。

### 開発サーバーの起動

```bash
# Expo開発サーバーを起動
pnpm start

# Androidで実行
pnpm run android

# iOSで実行（Macのみ）
pnpm run ios
```

## プロジェクト構成

FSD Lite（Feature-Sliced Design の簡易版）を採用しています。

```
SleepSupportApp/
├── app/                          # Expo Router (ルーティング定義のみ)
│   ├── (tabs)/                   # タブナビゲーション
│   │   ├── _layout.tsx           # タブ設定
│   │   ├── index.tsx             # ホームタブ
│   │   └── profile.tsx           # プロフィールタブ
│   └── _layout.tsx               # Root Layout
│
├── src/
│   ├── features/                 # 機能単位のモジュール（主戦場）
│   │   ├── auth/                 # 認証機能
│   │   ├── home/                 # ホーム画面
│   │   ├── light-sensor/         # 照度センサー機能
│   │   └── profile/              # プロフィール画面
│   │
│   └── shared/                   # アプリ全体で共有
│       ├── components/           # 汎用UIコンポーネント
│       ├── constants/            # 定数（テーマカラー等）
│       ├── lib/                  # 外部サービス連携（LLM, Calendar）
│       └── types/                # 共通型定義
│
├── assets/                       # 画像・フォント等
└── app.json                      # Expo設定ファイル
```

詳細なアーキテクチャについては [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

## バックエンド (Docker)

バックエンドはFastAPI + PostgreSQL（開発環境）/ Supabase（本番環境）で構成されています。

### 前提条件

- Docker Desktop（または Docker Engine + Docker Compose）

### バックエンドの起動

```bash
# 開発環境（FastAPI + PostgreSQL）
docker-compose up -d

# ログを見ながら起動
docker-compose up

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

### バックエンドのローカル開発（uv）

Pythonパッケージ管理に [uv](https://docs.astral.sh/uv/) を使用しています。

```bash
# uv のインストール（未導入の場合）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 依存関係のインストール
cd backend && uv sync

# テスト実行
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
- **Push前にpre-pushフックでブランチチェック**（`main`/`master`へのpush時や他人のコミットがある場合に警告し、任意でpush可能。現在のブランチとpush対象の一致を確認）

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

## 利用可能なスクリプト

| コマンド                  | 説明                                           |
| ------------------------- | ---------------------------------------------- |
| `pnpm start` / `pnpm dev` | Expo開発サーバーを起動                         |
| `pnpm run android`        | Androidで実行                                  |
| `pnpm run ios`            | iOSで実行                                      |
| `pnpm run setup`          | 環境チェック（初心者向け）                     |
| `pnpm run check`          | lint + 型チェック + フォーマット確認を一括実行 |
| `pnpm run reset`          | 詰まったときのリセット（node_modules 再構築）  |
| `pnpm run start:clear`    | キャッシュをクリアして起動（挙動が怪しいとき） |
| `pnpm run lint`           | ESLintでコードチェック                         |
| `pnpm run lint:fix`       | ESLintで自動修正                               |
| `pnpm run format`         | Prettierでフォーマット                         |
| `pnpm run typecheck`      | TypeScriptの型チェック                         |

## 照度の目安

| 照度（lux） | 環境                 |
| ----------- | -------------------- |
| 0-10        | 睡眠に最適           |
| 10-50       | 睡眠準備に適している |
| 50-300      | 通常の室内           |
| 300以上     | 明るすぎる           |

## 困ったときは

| 症状                         | 対処法                                                        |
| ---------------------------- | ------------------------------------------------------------- |
| `pnpm` が動かない            | `corepack enable` を実行                                      |
| Node のバージョンが合わない  | `.nvmrc` 参照。nvm なら `nvm use`                             |
| 起動がおかしい・エラーが出る | `pnpm run reset` でリセット                                   |
| Metro のキャッシュが怪しい   | `pnpm run start:clear` でキャッシュクリア起動                 |
| コミットが通らない           | `pnpm run lint:fix` と `pnpm run format` を実行               |
| push がブロックされる        | 保護ブランチや他人のコミットがある場合は確認して `y` で続行可 |

## 注意事項

- 照度センサーはAndroidデバイスでのみ利用可能です
- iOSおよびWebでは照度センサーは動作しません
- 実機でテストすることを推奨します

## ライセンス

Private

## チームメンバー

- （チームメンバーを追加してください）
