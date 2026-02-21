# SleepSupportApp - アーキテクチャドキュメント（最終版）

本ドキュメントは、SleepSupportApp の開発完了時点のアーキテクチャを記録したものです。

---

## 技術スタック

### フロントエンド

| カテゴリ         | 技術                                   | バージョン         |
| ---------------- | -------------------------------------- | ------------------ |
| Package Manager  | pnpm                                   | 9.x                |
| Framework        | React Native (Expo)                    | SDK 54             |
| Routing          | Expo Router                            | v6 (File-based)    |
| Language         | TypeScript                             | strict mode        |
| State Management | Zustand (Global) / React Hooks (Local) | v5                 |
| Styling          | StyleSheet (React Native 標準)         | -                  |
| 認証             | Supabase Auth                          | -                  |
| センサー         | expo-sensors, expo-camera, expo-av     | -                  |
| 通知             | expo-notifications                     | -                  |
| バックグラウンド | react-native-background-actions        | -                  |

### バックエンド

| カテゴリ         | 技術                      | バージョン |
| ---------------- | ------------------------- | ---------- |
| Framework        | FastAPI                   | v0.109+    |
| Language         | Python                    | 3.11+      |
| ORM              | SQLAlchemy 2 (async)      | v2.0+      |
| Database         | PostgreSQL (asyncpg)      | -          |
| Migration        | Alembic                   | v1.13+     |
| Package Manager  | uv                        | -          |
| LLM 連携        | OpenRouter API (httpx)    | -          |
| 認証             | Supabase JWT + PyJWT      | -          |
| Validation       | Pydantic v2               | -          |

### インフラ・DevOps

| カテゴリ       | 技術                              |
| -------------- | --------------------------------- |
| コンテナ       | Docker / Docker Compose           |
| 認証基盤       | Supabase (Cloud)                  |
| タスク自動化   | Taskfile (go-task)                |
| コード品質     | ESLint, Prettier, Ruff, MyPy      |
| 型チェック     | TypeScript (tsc), MyPy            |

---

## システム構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                        Android Device                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              React Native (Expo SDK 54)                   │  │
│  │                                                           │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │  │
│  │  │  Home   │ │ Monitor  │ │ SleepLog │ │  SleepPlan  │  │  │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘ └──────┬──────┘  │  │
│  │       │           │            │               │          │  │
│  │  ┌────┴───────────┴────────────┴───────────────┴──────┐  │  │
│  │  │              Zustand Stores                         │  │  │
│  │  │  (auth / settings / monitor / log / plan / alarm)   │  │  │
│  │  └────────────────────┬────────────────────────────────┘  │  │
│  │                       │                                   │  │
│  │  ┌────────────────────┴────────────────────────────────┐  │  │
│  │  │           apiClient (authenticatedFetch)             │  │  │
│  │  └────────────────────┬────────────────────────────────┘  │  │
│  └───────────────────────┼───────────────────────────────────┘  │
│                          │                                      │
│  ┌───────────────────────┼───────────────────────────────────┐  │
│  │  Device Sensors       │                                   │  │
│  │  - Light (expo-sensors)                                   │  │
│  │  - Noise (expo-av)                                        │  │
│  │  - Camera (expo-camera)                                   │  │
│  └───────────────────────┼───────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS
          ┌────────────────┼────────────────────┐
          │                │                    │
          ▼                ▼                    ▼
┌──────────────┐  ┌────────────────┐  ┌─────────────────┐
│   Supabase   │  │  FastAPI       │  │  OpenRouter API  │
│   (Auth)     │  │  Backend       │  │  (LLM)          │
│              │  │                │  │                  │
│  - Sign Up   │  │  /api/v1/...   │  │  睡眠プラン生成  │
│  - Login     │  │                │  │                  │
│  - JWT発行   │  └───────┬────────┘  └─────────────────┘
└──────────────┘          │
                          ▼
                 ┌─────────────────┐
                 │   PostgreSQL    │
                 │                 │
                 │  - users        │
                 │  - sleep_logs   │
                 │  - settings     │
                 │  - plan_cache   │
                 └─────────────────┘
```

---

## ディレクトリ構成

### フロントエンド (FSD Lite)

```
SleepSupportApp/
├── app/                              # Expo Router (ルーティング定義のみ)
│   ├── _layout.tsx                   # Root Layout (認証チェック, アラームオーバーレイ)
│   ├── +not-found.tsx                # 404 ページ
│   ├── (auth)/
│   │   ├── _layout.tsx               # Auth スタックレイアウト
│   │   ├── login.tsx                 # ログイン -> LoginScreen
│   │   └── signup.tsx                # サインアップ -> SignupScreen
│   └── (tabs)/
│       ├── _layout.tsx               # タブ設定
│       ├── index.tsx                 # ホーム -> HomeScreen
│       ├── sleep-plan.tsx            # 睡眠プラン -> SleepPlanScreen
│       ├── sleep-monitor.tsx         # モニター -> SleepMonitorScreen
│       ├── sleep-log.tsx             # 睡眠ログ -> SleepLogScreen
│       ├── light-sensor.tsx          # 照度センサー (タブ非表示)
│       └── profile.tsx               # 設定 -> SleepSettingsScreen
│
├── src/
│   ├── features/                     # ★ 機能単位で完結
│   │   ├── alarm/                    # アラーム機能
│   │   │   ├── AlarmScreen.tsx
│   │   │   ├── alarmStore.ts
│   │   │   ├── types.ts
│   │   │   ├── components/
│   │   │   │   └── MissionCamera.tsx
│   │   │   └── hooks/
│   │   │       └── useAlarm.ts
│   │   │
│   │   ├── auth/                     # 認証機能
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   └── authStore.ts
│   │   │
│   │   ├── home/                     # ホーム画面
│   │   │   ├── HomeScreen.tsx
│   │   │   └── components/
│   │   │       └── MorningReviewCard.tsx
│   │   │
│   │   ├── light-sensor/             # 照度センサー機能
│   │   │   ├── LightSensorScreen.tsx
│   │   │   ├── LightSensorStore.ts
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   ├── components/
│   │   │   │   └── LightMeter.tsx
│   │   │   └── hooks/
│   │   │       ├── useAmbientLight.ts
│   │   │       ├── useCameraBrightness.ts
│   │   │       ├── useDeviceOrientation.ts
│   │   │       └── useLightSensor.ts
│   │   │
│   │   ├── sleep-log/                # 睡眠ログ機能
│   │   │   ├── SleepLogScreen.tsx
│   │   │   ├── sleepLogStore.ts
│   │   │   ├── sleepLogApi.ts
│   │   │   ├── pendingLastNightStore.ts
│   │   │   ├── types.ts
│   │   │   ├── mockData.ts
│   │   │   └── components/
│   │   │       ├── SleepLogList.tsx
│   │   │       ├── SleepScoreDisplay.tsx
│   │   │       ├── ScoreBreakdown.tsx
│   │   │       ├── WeeklyTrendChart.tsx
│   │   │       ├── SleepLogEditModal.tsx
│   │   │       └── AddSleepLogModal.tsx
│   │   │
│   │   ├── sleep-monitor/            # 睡眠モニター機能
│   │   │   ├── SleepMonitorScreen.tsx
│   │   │   ├── sleepMonitorStore.ts
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   └── components/
│   │   │   │   ├── ScoreCard.tsx
│   │   │   │   ├── PhaseIndicator.tsx
│   │   │   │   ├── EnvironmentStatus.tsx
│   │   │   │   └── UsageWarning.tsx
│   │   │   └── hooks/
│   │   │       ├── useNoiseSensor.ts
│   │   │       ├── useUsageTracker.ts
│   │   │       └── useSleepMonitor.ts
│   │   │
│   │   ├── sleep-plan/               # AI 睡眠プラン機能
│   │   │   ├── SleepPlanScreen.tsx
│   │   │   ├── sleepPlanStore.ts
│   │   │   ├── types.ts
│   │   │   ├── components/
│   │   │   │   ├── WeeklyPlanCard.tsx
│   │   │   │   ├── DayDetailModal.tsx
│   │   │   │   └── PlanStatus.tsx
│   │   │   └── api/
│   │   │       └── sleepPlanApi.ts
│   │   │
│   │   ├── sleep-schedule/           # 睡眠スケジュール
│   │   │   ├── components/
│   │   │   │   └── SleepAdvice.tsx
│   │   │   └── hooks/
│   │   │       └── useSleepSchedule.ts
│   │   │
│   │   └── sleep-settings/           # 睡眠設定機能
│   │       ├── SleepSettingsScreen.tsx
│   │       ├── sleepSettingsStore.ts
│   │       ├── settingsApi.ts
│   │       └── types.ts
│   │
│   └── shared/                       # アプリ全体で共有
│       ├── components/
│       │   ├── Button.tsx
│       │   └── WheelPicker.tsx
│       ├── constants/
│       │   └── index.ts              # COLORS, APP_CONFIG
│       ├── lib/
│       │   ├── apiClient.ts          # authenticatedFetch, apiV1Fetch
│       │   ├── supabase.ts           # Supabase クライアント
│       │   ├── llm.ts                # LLM クライアント
│       │   ├── gemini.ts             # Gemini 実装
│       │   ├── googleCalendar.ts     # Google Calendar 連携
│       │   └── notifications.ts      # プッシュ通知
│       └── types/
│           └── index.ts
│
├── assets/                           # 画像・フォント等
├── patches/                          # pnpm パッチファイル
├── babel.config.js                   # Path alias 設定
├── tsconfig.json                     # TypeScript 設定
├── app.json                          # Expo 設定
└── package.json                      # 依存関係・スクリプト
```

### バックエンド (Onion Architecture)

```
backend/
├── app/
│   ├── main.py                       # FastAPI アプリ初期化・ミドルウェア設定
│   ├── config.py                     # 環境変数設定 (DATABASE_URL, OPENROUTER_KEY 等)
│   ├── database.py                   # DB 接続のリエクスポート
│   │
│   ├── domain/                       # ドメイン層 (ビジネスルール・インターフェース)
│   │   ├── user/
│   │   │   └── repositories.py       # IUserRepository
│   │   ├── sleep_log/
│   │   │   └── repositories.py       # ISleepLogRepository
│   │   ├── plan/
│   │   │   ├── repositories.py       # IPlanCacheRepository
│   │   │   └── value_objects.py      # build_signature_hash()
│   │   └── settings/
│   │       └── repositories.py       # ISettingsRepository
│   │
│   ├── application/                  # アプリケーション層 (ユースケース)
│   │   ├── base.py                   # BaseUseCase
│   │   ├── user/
│   │   │   ├── create_user.py        # CreateUserUseCase
│   │   │   ├── get_user.py           # GetUserUseCase, GetAllUsersUseCase
│   │   │   ├── update_user.py        # UpdateUserUseCase
│   │   │   └── delete_user.py        # DeleteUserUseCase
│   │   ├── sleep_log/
│   │   │   ├── create_sleep_log.py   # CreateSleepLogUseCase
│   │   │   ├── get_sleep_logs.py     # GetSleepLogsUseCase
│   │   │   └── update_mood.py        # Mood 更新
│   │   ├── settings/
│   │   │   ├── get_settings.py       # GetSettingsUseCase
│   │   │   └── put_settings.py       # PutSettingsUseCase
│   │   └── plan/
│   │       ├── get_or_create_plan.py # GetOrCreatePlanUseCase
│   │       └── ports.py              # IPlanGenerator インターフェース
│   │
│   ├── infrastructure/               # インフラ層 (実装)
│   │   ├── persistence/
│   │   │   ├── database.py           # SQLAlchemy セットアップ
│   │   │   ├── models/               # ORM モデル
│   │   │   │   ├── user.py           # User
│   │   │   │   ├── sleep_log.py      # SleepLog
│   │   │   │   ├── sleep_settings.py # SleepSettings
│   │   │   │   └── sleep_plan_cache.py # SleepPlanCache
│   │   │   └── repositories/         # リポジトリ実装
│   │   │       ├── base.py
│   │   │       ├── user_repository.py
│   │   │       ├── sleep_log_repository.py
│   │   │       ├── sleep_settings_repository.py
│   │   │       └── sleep_plan_cache_repository.py
│   │   ├── auth/
│   │   │   └── supabase_verifier.py  # JWT 検証
│   │   └── llm/
│   │       └── openrouter_client.py  # OpenRouter API クライアント
│   │
│   └── presentation/                 # プレゼンテーション層 (HTTP API)
│       ├── api/
│       │   ├── health.py             # ヘルスチェック
│       │   ├── users.py              # ユーザー CRUD
│       │   ├── sleep_logs.py         # 睡眠ログ
│       │   ├── settings.py           # 設定
│       │   └── plan.py               # 睡眠プラン
│       ├── schemas/                  # Pydantic スキーマ
│       │   ├── user.py
│       │   ├── sleep_log.py
│       │   ├── settings.py
│       │   └── plan.py
│       └── dependencies/
│           └── auth.py               # 認証依存関係
│
├── alembic/                          # DB マイグレーション
├── tests/                            # テスト
├── pyproject.toml                    # Python 依存関係
├── Dockerfile                        # コンテナ定義
└── alembic.ini                       # Alembic 設定
```

---

## API エンドポイント一覧

| メソッド | エンドポイント                  | 説明                                 | 認証 |
| -------- | ------------------------------- | ------------------------------------ | ---- |
| GET      | `/`                             | API 情報                             | 不要 |
| GET      | `/api/v1/health`                | ヘルスチェック                       | 不要 |
| GET      | `/api/v1/health/db`             | DB 接続チェック                      | 不要 |
| POST     | `/api/v1/users`                 | ユーザー作成                         | 必要 |
| GET      | `/api/v1/users`                 | ユーザー一覧取得                     | 必要 |
| GET      | `/api/v1/users/{user_id}`       | ユーザー取得                         | 必要 |
| PUT      | `/api/v1/users/{user_id}`       | ユーザー更新                         | 必要 |
| DELETE   | `/api/v1/users/{user_id}`       | ユーザー削除                         | 必要 |
| GET      | `/api/v1/sleep-logs`            | 睡眠ログ取得 (limit: 1-100)         | 必要 |
| POST     | `/api/v1/sleep-logs`            | 睡眠ログ作成                         | 必要 |
| PATCH    | `/api/v1/sleep-logs/{log_id}`   | 睡眠ログ部分更新                     | 必要 |
| GET      | `/api/v1/settings`              | 設定取得 (未保存時はデフォルト返却)  | 必要 |
| PUT      | `/api/v1/settings`              | 設定保存・更新 (upsert)             | 必要 |
| POST     | `/api/v1/sleep-plans`           | 週間睡眠プラン取得・生成 (force=true でキャッシュ無視) | 必要 |

---

## データベーススキーマ

### users

| カラム     | 型        | 制約               |
| ---------- | --------- | ------------------ |
| id         | UUID      | PK                 |
| email      | VARCHAR   | UNIQUE, NOT NULL   |
| name       | VARCHAR   | NOT NULL           |
| created_at | TIMESTAMP | DEFAULT now()      |
| updated_at | TIMESTAMP | DEFAULT now()      |

### sleep_logs

| カラム               | 型        | 制約                  |
| -------------------- | --------- | --------------------- |
| id                   | UUID      | PK                    |
| user_id              | UUID      | FK -> users.id        |
| date                 | DATE      | UNIQUE per user       |
| score                | INT       | 0-100                 |
| scheduled_sleep_time | TIMESTAMP | NULLABLE              |
| usage_penalty        | INT       | DEFAULT 0             |
| environment_penalty  | INT       | DEFAULT 0             |
| phase1_warning       | BOOL      | DEFAULT false         |
| phase2_warning       | BOOL      | DEFAULT false         |
| light_exceeded       | BOOL      | DEFAULT false         |
| noise_exceeded       | BOOL      | DEFAULT false         |
| mood                 | INT       | 1-5, NULLABLE         |
| created_at           | TIMESTAMP | DEFAULT now()         |

### sleep_settings

| カラム                     | 型        | 制約                  |
| -------------------------- | --------- | --------------------- |
| user_id                    | UUID      | PK, FK -> users.id    |
| wake_up_hour               | INT       | DEFAULT 7             |
| wake_up_minute             | INT       | DEFAULT 0             |
| sleep_duration_hours       | INT       | DEFAULT 8             |
| resilience_window_minutes  | INT       | DEFAULT 20            |
| mission_enabled            | BOOL      | DEFAULT false         |
| mission_target             | VARCHAR   | NULLABLE              |
| preparation_minutes        | INT       | DEFAULT 30            |
| ics_url                    | VARCHAR   | NULLABLE              |
| override_date              | DATE      | NULLABLE              |
| override_sleep_hour        | INT       | NULLABLE              |
| override_sleep_minute      | INT       | NULLABLE              |
| override_wake_hour         | INT       | NULLABLE              |
| override_wake_minute       | INT       | NULLABLE              |
| updated_at                 | TIMESTAMP | DEFAULT now()         |

### sleep_plan_cache

| カラム         | 型        | 制約               |
| -------------- | --------- | ------------------ |
| user_id        | UUID      | PK, FK -> users.id |
| signature_hash | VARCHAR   | INDEX              |
| plan_json      | TEXT      | JSON 文字列        |
| created_at     | TIMESTAMP | DEFAULT now()      |

---

## 状態管理 (Zustand Stores)

### authStore

ユーザー認証状態を管理。ログイン/ログアウト、ローディング/エラー状態を保持。

### sleepSettingsStore

睡眠設定を管理。起床時間、睡眠時間、準備時間、ミッション設定、当日オーバーライドの管理。API との同期 (`fetchSettings` / `saveSettings`)。計算済み就寝時間の算出も担当。

### sleepMonitorStore

睡眠モニターの実行状態を管理。モニタリングフェーズ（idle → phase1 → phase2 → phase3 → completed）の遷移、環境データ（照度・騒音）、端末使用時間、警告、スコア計算を担当。

### sleepLogStore

睡眠ログの CRUD と一覧表示を管理。API からのログ取得、新規追加、気分記録、編集を処理。

### sleepPlanStore

AI 生成の週間睡眠プランを管理。API からのプラン取得、キャッシュ日付の管理、今日のプラン抽出を担当。

### alarmStore

アラームの鳴動状態を管理。フェーズ遷移（idle → gentle → strict → completed）、音量制御、スヌーズを処理。

### LightSensorStore

照度センサーのバックグラウンドタスク状態を管理。

---

## アーキテクチャパターン

### フロントエンド: FSD Lite (Feature-Sliced Design 簡易版)

```
機能の追加フロー:

1. src/features/[機能名]/ にフォルダを作成
2. 画面・コンポーネント・hooks・store・types を機能フォルダ内に配置
3. index.ts で外部公開する API を定義
4. app/(tabs)/ または app/(auth)/ にルーティングファイルを追加

原則:
- app/ にはロジックを書かない（import して表示するだけ）
- feature は自己完結させる（他の feature に依存しない）
- shared は本当に汎用的なもののみ
```

### バックエンド: Onion Architecture

```
リクエストの流れ:

HTTP Request
    ↓
Presentation (Router + Schema)
    ↓ Pydantic でバリデーション
Application (UseCase)
    ↓ ビジネスロジック実行
Domain (Repository Interface)
    ↓ 抽象に依存
Infrastructure (Repository Impl + ORM)
    ↓ DB 操作
PostgreSQL

原則:
- 内側の層は外側に依存しない
- Domain 層はインターフェースのみ定義
- Infrastructure 層がインターフェースを実装
- Application 層がユースケースを組み立て
```

### 認証フロー

```
1. ユーザーが Supabase Auth でログイン/サインアップ
2. Supabase が JWT アクセストークンを発行
3. フロントエンドが apiClient 経由で Authorization ヘッダーに JWT を付与
4. バックエンドの supabase_verifier が JWT を検証
5. user_id を抽出してユースケースに渡す
```

### 睡眠プランのキャッシュ戦略

```
1. ユーザーの設定 + 直近の睡眠ログ + カレンダー情報からハッシュ (signature_hash) を生成
2. DB に同じハッシュのキャッシュが存在すればそれを返却
3. 存在しなければ OpenRouter API (LLM) でプランを生成し、キャッシュに保存
4. force=true パラメータでキャッシュを無視して再生成可能
```

---

## 睡眠モニターのフェーズ遷移

```
idle (待機)
  ↓ モニタリング開始
phase1 (準備フェーズ)
  ↓ 就寝時間の一定時間前
phase2 (入眠前フェーズ)
  ↓ 就寝時間
phase3 (睡眠中フェーズ)
  ↓ モニタリング終了
completed (完了)
  → 睡眠ログを自動記録
```

各フェーズで照度・騒音・端末使用時間を計測し、基準値を超えた場合にペナルティとしてスコアを減点。

---

## コマンド一覧

### フロントエンド

```bash
pnpm start              # 開発サーバー起動
pnpm run android        # Android 実機ビルド
pnpm run lint           # ESLint 実行
pnpm run lint:fix       # ESLint 自動修正
pnpm run typecheck      # TypeScript 型チェック
pnpm run format         # Prettier フォーマット
pnpm run check          # lint + typecheck + format:check 一括実行
```

### 開発環境 (Taskfile)

```bash
task dev-up              # 全環境起動 (実機)
task dev-up-emulator     # 全環境起動 (エミュレータ)
task dev-down            # Docker + Supabase 停止
task test:db             # バックエンドテスト実行
```

---

## Path Alias

```typescript
import { HomeScreen } from '@features/home';
import { Button } from '@shared/components';
import { COLORS } from '@shared/constants';
import { apiV1Fetch } from '@shared/lib';
```

---

## テーマカラー

```typescript
export const COLORS = {
  primary: '#6366F1',       // メインカラー（紫）
  secondary: '#8B5CF6',     // サブカラー
  background: {
    dark: '#0F172A',        // 暗い背景
    light: '#F8FAFC',       // 明るい背景
  },
  text: {
    dark: '#F8FAFC',        // 暗い背景上のテキスト
    light: '#0F172A',       // 明るい背景上のテキスト
  },
  success: '#10B981',       // 成功（緑）
  warning: '#F59E0B',       // 警告（オレンジ）
  error: '#EF4444',         // エラー（赤）
};
```
