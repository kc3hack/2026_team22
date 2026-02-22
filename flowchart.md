# SleepSupportApp フローチャート

## 1. アプリ全体フロー

```mermaid
flowchart TD
    A[アプリ起動] --> B{認証チェック}
    B -->|未認証| C[認証画面]
    C --> C1[ログイン]
    C --> C2[サインアップ]
    C1 --> D{認証成功?}
    C2 --> D
    D -->|失敗| C
    D -->|成功| E[タブ画面]
    B -->|認証済み| E

    E --> T1[ホーム]
    E --> T2[睡眠プラン]
    E --> T3[睡眠モニター]
    E --> T4[睡眠ログ]
    E --> T5[設定]

    T3 -->|モニタリング完了| T4
    T1 -->|気分記録 → AIプラン再生成| T2

    F{起床時刻到達?} -->|はい| G[アラームオーバーレイ表示]
    G -->|アラーム停止| E
```

## 2. 認証フロー

```mermaid
flowchart TD
    A[認証画面] --> B{操作選択}
    B -->|新規| C[サインアップフォーム]
    B -->|既存| D[ログインフォーム]

    C -->|メール + パスワード| E[Supabase Auth]
    D -->|メール + パスワード| E

    E --> F{認証結果}
    F -->|成功| G[JWT アクセストークン発行]
    G --> H[authStore にセッション保存]
    H --> I[apiClient に JWT セット]
    I --> J[バックエンド /api/v1/users で<br/>ユーザー作成/取得]
    J --> K[タブ画面へ遷移]

    F -->|失敗| L[エラー表示]
    L --> A
```

## 3. ホーム画面フロー

```mermaid
flowchart TD
    A[ホーム画面表示] --> B{朝の振り返り表示判定}
    B -->|pendingLastNight あり<br/>かつ mood 未記録| C[MorningReviewCard 表示]
    B -->|条件不一致| D[通常ホーム画面]

    C --> E[気分選択 1〜5]
    E --> F[sleepLogApi で mood 保存<br/>PATCH /api/v1/sleep-logs]
    F --> G[pendingLastNight クリア]
    G --> H{AIプラン再生成トリガー}
    H -->|force=true| I[睡眠プラン再生成<br/>POST /api/v1/sleep-plans]
    I --> D

    D --> J[今日の睡眠スケジュール表示]
    D --> K[直近の睡眠スコア表示]

    D --> L{カスタムスケジュール設定?}
    L -->|はい| M[override_date / override_sleep/wake 設定]
    M --> N[settingsApi で保存<br/>PUT /api/v1/settings]
    N --> D
```

## 4. 睡眠プラン生成フロー

```mermaid
flowchart TD
    A[睡眠プラン取得リクエスト<br/>POST /api/v1/sleep-plans] --> B[入力データ収集]

    B --> B1[sleep_settings 取得]
    B --> B2[直近 sleep_logs 取得]
    B --> B3[カレンダー情報 ICS 取得]

    B1 --> C[signature_hash 生成<br/>build_signature_hash]
    B2 --> C
    B3 --> C

    C --> D{force パラメータ?}
    D -->|force=true| F
    D -->|force=false| E{キャッシュ判定<br/>sleep_plan_cache}

    E -->|ヒット<br/>同一 signature_hash| G[キャッシュ返却]
    E -->|ミス| F[OpenRouter API で<br/>LLM プラン生成]

    F --> H[生成結果を<br/>sleep_plan_cache に保存]
    H --> I[週間プラン返却<br/>7日分の就寝・起床時刻 + アドバイス]

    G --> I
```

## 5. 睡眠モニターフロー

```mermaid
flowchart TD
    A[睡眠モニター画面] --> B[idle: 待機モード]
    B -->|開始ボタン| C[モニタリング開始]

    C --> D[Phase 1: 準備フェーズ<br/>30分間]
    D --> E[Phase 2: 入眠前フェーズ<br/>20分間]
    E --> F[Phase 3: 睡眠中フェーズ<br/>10分間]
    F --> G[completed: 完了]

    D --> S1[センサー監視]
    E --> S1
    F --> S1

    S1 --> S2[照度チェック<br/>useAmbientLight]
    S1 --> S3[騒音チェック<br/>useNoiseSensor]
    S1 --> S4[端末使用時間チェック<br/>useUsageTracker]

    S2 -->|基準超過| W1[light_exceeded: true]
    S3 -->|基準超過| W2[noise_exceeded: true]
    S4 -->|基準超過| W3[usage_penalty 加算]

    W1 --> SC[スコア計算<br/>Base 100 - ペナルティ]
    W2 --> SC
    W3 --> SC

    G --> H[pendingLastNightStore に保存]
    H --> I[睡眠ログ作成<br/>POST /api/v1/sleep-logs]
```

## 6. アラームフロー

```mermaid
flowchart TD
    A[起床時刻到達] --> B{カレンダー連携?}
    B -->|ICS URL あり| C[予定確認 →<br/>resilience_window 調整]
    B -->|なし| D[通常起床時刻]
    C --> D

    D --> E[Gentle Phase<br/>優しいアラーム音]
    E --> F{ユーザー反応?}

    F -->|スヌーズ| G[一定時間後に再鳴動]
    G --> E

    F -->|無反応 / 時間経過| H[Strict Phase<br/>強いアラーム音 + 音量増加]

    H --> I{ミッション有効?<br/>mission_enabled}
    I -->|はい| J[カメラミッション<br/>MissionCamera]
    J --> K{mission_target 撮影成功?}
    K -->|成功| L[アラーム停止]
    K -->|失敗| H

    I -->|いいえ| M[停止ボタン]
    M --> L
    F -->|停止| L

    L --> N[alarmStore: completed]
```

## 7. データフロー（システム間連携）

```mermaid
flowchart LR
    subgraph Device[Android デバイス]
        FE[React Native<br/>Expo SDK 54]
        SENSOR[デバイスセンサー<br/>照度 / 騒音 / カメラ]
        STORE[Zustand Stores<br/>auth / settings / monitor<br/>log / plan / alarm]
    end

    subgraph External[外部サービス]
        SUPA[Supabase Auth<br/>JWT 発行・検証]
        GCAL[Google Calendar<br/>ICS フィード]
        LLM[OpenRouter API<br/>LLM 睡眠プラン生成]
    end

    subgraph Backend[FastAPI バックエンド]
        API[/api/v1/<br/>REST エンドポイント]
        UC[Application 層<br/>ユースケース]
        REPO[Infrastructure 層<br/>リポジトリ]
    end

    DB[(PostgreSQL<br/>users / sleep_logs<br/>settings / plan_cache)]

    FE <-->|authenticatedFetch<br/>+ JWT| API
    FE <-->|ログイン / サインアップ| SUPA
    FE -->|ICS 取得| GCAL
    SENSOR -->|環境データ| STORE
    STORE <--> FE

    API --> UC
    UC --> REPO
    REPO <--> DB
    UC -->|プラン生成| LLM
    API -->|JWT 検証| SUPA
```
