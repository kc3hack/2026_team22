# バックエンド起動と Expo 通信の仕組み

このドキュメントでは、バックエンドの起動フローと、Expo アプリからバックエンドへ通信する仕組みを説明します。

---

## 1. バックエンドの起動の仕組み

### 1.1 実機用とエミュレータ用のタスク

| タスク | 用途 | EXPO_PUBLIC_API_URL | 備考 |
|--------|------|---------------------|------|
| **task dev-up** | 実機 | `http://<LAN_IP>:8000`（PC の LAN IP） | 環境構築 ＋ .env.expo.local 更新 ＋ **Android ビルド＆起動** |
| **task dev-up-emulator** | Android エミュレータ | `http://10.0.2.2:8000` | 上記と同様に最後に **Android ビルド＆起動** |

- **実機で実行するとき** → 実機を USB 接続してから `task dev-up` を実行。PC と実機は同じ Wi‑Fi であること。
- **Android エミュレータで実行するとき** → エミュレータを起動してから `task dev-up-emulator` を実行。WiFi に依存しない。
- **WiFi を変えたら** → `task dev-up` を再実行する（LAN IP が変わるため）。
- **環境はそのままでアプリだけビルドし直すとき** → `task expo-android` を実行（事前に一度 dev-up / dev-up-emulator で .env.expo.local を作っておくこと）。

### 1.2 全体フロー

どちらのタスクも次の順序で開発環境を起動し、最後に Android アプリをビルド＆起動します。

```
1. pnpm supabase start       … Supabase ローカル（Auth 用）起動
2. docker-compose up -d      … API と DB を起動
3. sleep 3                   … DB の起動待ち
4. alembic upgrade head      … DB マイグレーション実行
5. write-expo-env.mjs        … .env.expo.local を更新（URL はタスクによって異なる）
6. expo run:android          … Android Development Build をビルド＆起動（Java 17）
```

### 1.3 Supabase ローカル

- **役割**: 認証（Auth）専用。アプリのデータ（users, sleep_plan_cache 等）は別の PostgreSQL で管理。
- **起動**: `pnpm supabase start`（Docker 必須）
- **Studio**: http://127.0.0.1:54323

### 1.4 docker-compose（API + DB）

| サービス | 内容 | ポート |
|----------|------|--------|
| **api** | FastAPI バックエンド | 8000 |
| **db** | PostgreSQL（アプリ用） | 5432 |

- **API**: `backend/Dockerfile` からビルド。uvicorn で FastAPI を起動。
- **DB**: PostgreSQL 15。`backend/init.sql` を初回のみ実行。
- **接続**: API は `postgresql+asyncpg://postgres:postgres@db:5432/sleepsupport` で DB に接続。
- **API のバインド**: `API_HOST=0.0.0.0` により、外部（実機・エミュレータ）からも接続可能。

### 1.5 DB マイグレーション（Alembic）

- **場所**: `backend/alembic/`
- **実行**: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sleepsupport uv run alembic upgrade head`
- **タイミング**: 起動タスク（`task dev-up` / `task dev-up-emulator`）内で docker-compose の後に実行。`sleep 3` で DB の起動を待ってから実行。
- **同期用 URL**: Alembic は同期ドライバを使うため、`postgresql+asyncpg://` を `postgresql://` に変換（psycopg2 使用）。

### 1.6 環境変数の流し込み

| スクリプト | 入力 | 出力 |
|------------|------|------|
| **supabase-env-for-compose.mjs** | `supabase status -o env` | シェルの export 文（SUPABASE_URL, SUPABASE_ANON_KEY 等） |
| **write-expo-env.mjs** | Supabase の env + 自前の EXPO_PUBLIC_API_URL | `.env.expo.local` |

- `eval "$(node scripts/supabase-env-for-compose.mjs)" && docker-compose up -d` で、Supabase の接続情報を docker-compose に渡す。
- `write-expo-env.mjs` は Supabase の接続情報と `EXPO_PUBLIC_API_URL` を `.env.expo.local` に書き出す。

---

## 2. Expo からバックエンドへの通信の仕組み

### 2.1 API URL の取得

Expo アプリがバックエンドの URL を知る経路は次のとおりです。

1. **app.config.js**  
   - `.env.expo.local` と `.env` を `dotenv` で読み込む。
   - `process.env.EXPO_PUBLIC_API_URL` を `expo.extra.apiUrl` に設定。
2. **アプリ内**  
   - `Constants.expoConfig?.extra?.apiUrl` または `process.env.EXPO_PUBLIC_API_URL` で参照。

### 2.2 EXPO_PUBLIC_API_URL の値

`write-expo-env.mjs` で決定されます。

| 条件 | 値 |
|------|-----|
| 未設定 or localhost/127.0.0.1 | `http://<LAN_IP>:8000`（PC の LAN IP） |
| 明示的に設定済み（例: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`） | その値 |

- **task dev-up** では環境変数を渡さないため、PC の LAN IP が設定される（実機用）。
- **task dev-up-emulator** では `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000` を渡して実行する（Android エミュレータ用）。

### 2.3 .env.expo.local の扱い

- **生成**: `task dev-up` または `task dev-up-emulator` のなかで、Android ビルドの直前に `write-expo-env.mjs` が実行される。
- **読み込み**: `app.config.js` が起動時に `dotenv` で読み込む。Android ビルド時にもこのファイルが参照される。
- **Metro**: `.env*` を Babel の対象から外すため、`metro.config.js` の `resolver.blockList` で除外している。
- **gitignore**: `.env.expo.local` は .gitignore 対象。

### 2.4 CORS

- **開発時**（`ENV=development`）: `allow_origins=["*"]` で全オリジンを許可。実機・Expo からのリクエストを受け付ける。
- **本番**: `CORS_ORIGINS` で指定したオリジンのみ許可。

### 2.5 通信フロー図

```
[Expo アプリ]                    [バックエンド]
     |                                |
     |  fetch(apiUrl + "/api/v1/...") |
     | ------------------------------>|
     |                                |  CORS チェック（dev: 全許可）
     |                                |  DB アクセス
     | <------------------------------|
     |   JSON レスポンス               |
```

### 2.6 実機・エミュレータでの接続先

| 実行環境 | 使うタスク | 接続先 URL |
|----------|------------|------------|
| Web / iOS シミュレータ | `task dev-up` | `http://<LAN_IP>:8000` |
| Android エミュレータ | `task dev-up-emulator` | `http://10.0.2.2:8000` |
| 実機 | `task dev-up` | `http://<LAN_IP>:8000`（PC と同一 Wi‑Fi であること） |

---

## 3. ファイル一覧

| ファイル | 役割 |
|----------|------|
| `Taskfile.yml` | `task dev-up` / `task dev-up-emulator` / `task dev-down` の定義 |
| `docker-compose.yml` | API と DB のコンテナ定義 |
| `scripts/supabase-env-for-compose.mjs` | Supabase の env をシェル用に出力 |
| `scripts/write-expo-env.mjs` | `.env.expo.local` の生成 |
| `app.config.js` | Expo 設定。`extra.apiUrl` の設定 |
| `metro.config.js` | `.env*` を Babel 対象から除外 |
| `backend/alembic/` | DB マイグレーション |
| `backend/app/main.py` | FastAPI アプリ。CORS 設定 |

---

## 4. トラブルシューティング

| 症状 | 確認ポイント |
|------|--------------|
| 接続できない（実機） | `task dev-up` を使ったか。PC と実機が同じ Wi‑Fi か。WiFi を変えたら `task dev-up` を再実行する。ファイアウォールで 8000 番が許可されているか。 |
| 接続できない（Android エミュレータ） | `task dev-up-emulator` を使ったか。接続先が `10.0.2.2:8000` になっているか。 |
| .env.expo.local が空 | `task dev-up` または `task dev-up-emulator` を実行したか。Supabase が起動しているか。 |
| テーブルが存在しない | 起動タスク内でマイグレーションが実行されているか。`alembic upgrade head` を手動実行してみる。 |
