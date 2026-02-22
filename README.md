# SleepSupportApp(仮)

![SleepSupportApp](https://kc3.me/cms/wp-content/uploads/2026/02/444e7120d5cdd74aa75f7a94bf8821a5-scaled.png)

## チーム名

チーム22 「新規性はありますか？」

## 背景・課題・解決されること

### 背景

現代社会では、スマートフォンの長時間利用や不規則な生活リズムにより、睡眠の質が低下している人が増えています。特に関西圏の学生や社会人は、通勤・通学時間の長さや夜型の生活習慣から、十分な睡眠を確保できていないケースが多く見られます。

### 課題

- 自分の寝室環境（明るさ・騒音）が睡眠に適しているか客観的に把握できない
- 理想的な睡眠スケジュールを立てても、なかなか継続できない
- 朝の目覚めが悪く、二度寝してしまう

### 解決

SleepSupportApp は、スマートフォンのセンサーを活用して寝室の環境（照度・騒音）をリアルタイムにモニタリングし、AI が個人に最適化された週間睡眠プランを生成します。さらに、ミッション付きアラーム機能により確実な起床をサポートし、睡眠ログの記録・分析を通じて継続的な睡眠改善を実現します。

## プロダクト説明

SleepSupportApp は、AI 駆動の総合睡眠支援 Android アプリケーションです。

### 主な機能

- **睡眠環境モニタリング**: スマートフォンのセンサーで寝室の照度・騒音レベルをリアルタイム計測し、睡眠に適した環境かどうかをスコアリング
- **AI 睡眠プラン生成**: ユーザーのスケジュールや睡眠履歴に基づき、LLM が最適な週間睡眠プランを自動生成
- **睡眠ログ・分析**: 日々の睡眠スコアや気分を記録し、週間トレンドをグラフで可視化
- **ミッション付きアラーム**: 段階的アラーム（やさしい → 厳しい）と、カメラを使ったターゲット撮影チャレンジによる確実な起床サポート
- **睡眠スケジュール管理**: 起床時間・睡眠時間の設定と、それに基づいたアドバイスの提供

## 操作説明・デモ動画

[デモ動画はこちら](https://www.youtube.com/watch?v=fbzGp0XJGq8)

### 基本的な使い方

1. アプリを起動し、アカウントを作成・ログイン
2. 設定画面で起床時間・希望睡眠時間を設定
3. ホーム画面で今日の睡眠プランを確認
4. 就寝前に睡眠モニターを起動し、寝室環境をチェック
5. アラームが設定された時間に段階的に鳴動し、必要に応じてミッションをクリアして起床
6. 起床後に気分を記録し、睡眠ログで自分の睡眠傾向を振り返り

## 注力したポイント

### アイデア面

- スマートフォンの内蔵センサー（照度・マイク）を活用することで、専用デバイスなしに睡眠環境を計測できるようにした点
- LLM による個人最適化された睡眠プラン生成で、画一的なアドバイスではなくユーザーに寄り添った提案を実現
- カメラを使ったミッション型アラームにより、ゲーミフィケーション要素で楽しく確実に起床できる仕組み

### デザイン面

- 就寝前の利用を考慮し、目に優しい落ち着いた配色とシンプルな UI を採用
- 睡眠フェーズ（準備 → 入眠前 → 睡眠中）に応じた画面遷移で、直感的な操作体験を実現
- 睡眠スコアやトレンドをグラフで可視化し、改善の実感を得やすいデザイン

### その他

- バックグラウンドでのセンサー計測に対応し、画面オフ時でもモニタリングを継続
- 睡眠プランのキャッシュ機構を実装し、LLM API への不要なリクエストを削減
- Onion Architecture（バックエンド）と FSD Lite（フロントエンド）による保守性の高いコード設計

## 使用技術

### フロントエンド

| カテゴリ             | 技術                               | バージョン      |
| -------------------- | ---------------------------------- | --------------- |
| フレームワーク       | React Native (Expo)                | SDK 54          |
| 言語                 | TypeScript                         | strict mode     |
| ルーティング         | Expo Router                        | v6 (file-based) |
| 状態管理             | Zustand                            | v5              |
| パッケージマネージャ | pnpm                               | 9.x             |
| 認証                 | Supabase Auth                      | -               |
| センサー             | expo-sensors, expo-camera, expo-av | -               |
| 通知                 | expo-notifications                 | -               |
| バックグラウンド処理 | react-native-background-actions    | -               |

### バックエンド

| カテゴリ             | 技術                   | バージョン |
| -------------------- | ---------------------- | ---------- |
| フレームワーク       | FastAPI                | v0.109+    |
| 言語                 | Python                 | 3.11+      |
| ORM                  | SQLAlchemy 2 (async)   | v2.0+      |
| データベース         | PostgreSQL             | asyncpg    |
| マイグレーション     | Alembic                | v1.13+     |
| パッケージマネージャ | uv                     | -          |
| LLM 連携             | OpenRouter API (httpx) | -          |
| 認証                 | Supabase JWT + PyJWT   | -          |

### インフラ・DevOps

| カテゴリ     | 技術                         |
| ------------ | ---------------------------- |
| コンテナ     | Docker / Docker Compose      |
| 認証基盤     | Supabase (Cloud)             |
| タスク自動化 | Taskfile (go-task)           |
| コード品質   | ESLint, Prettier, Ruff, MyPy |
| 型チェック   | TypeScript (tsc), MyPy       |

## 🚀 バックエンド・インフラ・アーキテクチャ

本プロジェクトでは、AI 駆動開発のメリットを最大化しつつ、将来的な拡張性（AWS ECS 等へのデプロイ）を見据え、堅牢で開発体験（DX）の高いアーキテクチャを設計・構築しました。

### 1. アーキテクチャ設計

#### オニオンアーキテクチャの採用

AI 駆動で開発を進めるにあたり、LLM が事前学習で深く理解している標準的なデザインパターン「オニオンアーキテクチャ」を採用しました。これにより、AI によるコード生成の品質が安定するだけでなく、コードの関心事が明確に分離され、修正・テストのしやすい保守性の高いバックエンドを実現しています。

```mermaid
graph TB
    subgraph 外層
        API[API 層 - FastAPI エンドポイント]
        Infrastructure[インフラ層 - DB/外部API]
    end

    subgraph 中層
        UseCases[ユースケース層 - ビジネスロジック]
    end

    subgraph 内層
        Domain[ドメイン層 - エンティティ・値オブジェクト]
    end

    API --> UseCases
    UseCases --> Domain
    UseCases --> Infrastructure
    Infrastructure --> Domain
```

### 2. パフォーマンスとコストの最適化

#### LLM リクエストのハッシュ化による高度なキャッシュ機構

高価で時間のかかる LLM API への不要なリクエストを抑えるため、「カレンダーの予定」「睡眠ログ」「設定情報」「当日の日付」などの入力パラメータ群から一意のシグネチャ（ハッシュ）を生成しています。このハッシュを用いて過去の計算結果を DB 内で検索・判定することで、同一条件であればキャッシュを即座に返却し、UX の劇的な向上（高速なレスポンス）と API コストの最小化を両立させています。

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant API as FastAPI
    participant Service as 睡眠プランサービス
    participant Hash as ハッシュ生成
    participant DB as PostgreSQL

    Client->>API: 睡眠プラン取得リクエスト
    API->>Service: 生成処理の依頼

    Service->>Service: 入力パラメータ収集
    Note over Service: カレンダー予定・睡眠ログ<br/>設定情報・当日日付
    Service->>Hash: パラメータ群を渡す
    Hash->>Hash: SHA256等でハッシュ化
    Hash-->>Service: シグネチャ（ハッシュ）

    Service->>DB: ハッシュでキャッシュ検索

    alt キャッシュヒット
        DB-->>Service: 過去の計算結果を返却
        Service-->>API: キャッシュから即座に返却
        API-->>Client: 高速レスポンス（LLM呼び出しなし）
    else キャッシュミス
        DB-->>Service: 該当なし
        Service->>Service: LLM API を呼び出し
        Service->>DB: 結果をキャッシュとして保存
        Service-->>API: 計算結果を返却
        API-->>Client: レスポンス返却
    end
```

### 3. インフラストラクチャとセキュリティ

#### Docker 完結の独立したインフラスタック

ハッカソンにおける初期開発スピードを重視しつつ、将来的には AWS（ECS など）へのデプロイを見据え、ローカルの `docker-compose` で完全に動作するインフラ環境を構築しました。

```mermaid
graph LR
    subgraph ローカル開発
        Docker[Docker Compose]
        DB[(PostgreSQL)]
        API[FastAPI API]
    end

    subgraph 将来: AWS
        ECS[AWS ECS]
        RDS[(RDS)]
    end

    Docker --> DB
    Docker --> API
    API --> DB

    style ローカル開発 fill:#e1f5fe
    style 将来: AWS fill:#fff3e0
```

#### BaaS への過度な依存を排除しセキュリティを担保

Firebase などの BaaS への過度なロックインを避け、Supabase は「認証基盤」としてのみ活用しています。Row Level Security (RLS) 単体に依存したデータ管理はセキュリティや柔軟性の面でリスクになり得ると判断し、データの保存や複雑なビジネスロジックはすべて独自のバックエンド（FastAPI + PostgreSQL）を通過させる堅牢な設計としています。

```mermaid
flowchart TB
    subgraph クライアント
        App[Expo アプリ]
    end

    subgraph Supabase
        Auth[Supabase Auth<br/>認証のみ]
    end

    subgraph 独自バックエンド
        FastAPI[FastAPI]
        PostgreSQL[(PostgreSQL)]
    end

    App -->|ログイン・JWT発行| Auth
    App -->|API呼び出し<br/>JWT付き| FastAPI
    FastAPI -->|認証検証| Auth
    FastAPI -->|データ操作| PostgreSQL
```

### 4. 圧倒的な開発体験（DX）の向上

#### Taskfile による「ワンクリック環境構築」とネットワーク自動解決

ネイティブアプリ開発において最も煩雑な「スマホ実機やエミュレーターから、ローカル Docker 内の API への IP アドレス解決・ポートフォワーディング」の課題を完全に自動化しました。`task dev-up` や `task dev-up-emulator` コマンドを実行するだけで、以下のフローが一括で処理されます。

```mermaid
flowchart TB
    Start([task dev-up 実行]) --> A[1. データベースコンテナの起動]
    A --> B[2. DB 接続待機]
    B --> C[3. Alembic マイグレーション]
    C --> D[4. シードデータ投入]
    D --> E{実機 or エミュレータ?}
    E -->|実機| F[5a. LAN IP で .env.expo.local 生成]
    E -->|エミュレータ| G[5b. 10.0.2.2 で .env.expo.local 生成]
    F --> H[6. アプリビルド・起動]
    G --> H
    H --> Done([開発開始])
```

この仕組みにより、新規参画メンバーでも迷うことなく、一瞬で開発に集中できる極めて高い開発体験を実現しました。

### 5. 高速・堅牢な CI/CD パイプライン

#### 徹底したキャッシュ戦略による実行時間の短縮

GitHub Actions での CI 実行時間を短縮するため、フロントエンドでは `pnpm store` のキャッシュを利用し、バックエンドでは `astral-sh/setup-uv` を用いた pip キャッシュを導入しています。また、Dockerfile でも `uv sync --no-install-project` を活用し、依存関係のレイヤーキャッシュを最大限に効かせる工夫を施しています。

#### エミュレーターを用いた統合テストの完全自動化

静的解析やバックエンドのテスト（pytest）に加え、`android-emulator-runner` を使用して CI 上でネイティブアプリのエミュレーター環境を再現しています。ビルドから起動確認までを自動化することで、「とりあえず Push・PR を送り、バグの確認はほぼ GitHub 上で完結させる」という高速でアジャイルな開発サイクルを実現しています。

```mermaid
flowchart LR
    subgraph CI["GitHub Actions CI"]
        Lint[Lint / 型チェック]
        Backend[Backend pytest]
        Cache[cache: pnpm / uv / pip]
        Emulator[android-emulator-runner]
        Build[Expo Build]
        Launch[起動確認]
    end

    Push[Push / PR] --> Lint
    Lint --> Backend
    Cache -.->|高速化| Lint
    Cache -.->|高速化| Backend
    Backend --> Emulator
    Emulator --> Build
    Build --> Launch
```

## チームメンバー

| メンバー        | 担当領域                                 |
| --------------- | ---------------------------------------- |
| @taitaitai58    | バックエンド (API設計・DB・認証)         |
| @yuito393439    | フロントエンド (UI/UXデザイン・画面実装) |
| @Taku-taku-Taku | センサー連携                             |
| @You8102        | バックグラウンド処理                     |
| @taniharu1214   | アラーム・カレンダー連携                 |

<!--
markdownの記法はこちらを参照してください！
https://docs.github.com/ja/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
-->
