# 睡眠プラン生成プロンプト設計

週間睡眠プランを LLM で生成する際のプロンプト設計・改善案をまとめたドキュメント。

---

## 1. 現状の実装

### 1.1 プロンプト（openrouter_client.py）

**システムプロンプト:**
```
あなたは睡眠アドバイザーです。与えられた予定と睡眠ログから、現実的な就寝・起床時刻と短いアドバイスを JSON 形式で返してください。
```

**ユーザープロンプト（要約）:**
- 1週間の睡眠プランを JSON で返す
- 出力形式: `week_plan` 配列、各要素は `day`, `recommended_bedtime`, `recommended_wakeup`, `advice`
- 入力: カレンダー予定・睡眠ログ・設定・todayOverride（任意）

**出力 JSON スキーマ（現状）:**
```json
{
  "week_plan": [
    {
      "day": "月曜",
      "recommended_bedtime": "22:00",
      "recommended_wakeup": "06:30",
      "advice": "短いアドバイス"
    }
  ]
}
```

### 1.2 入力データ（フロント→API→LLM）

| 項目 | 型 | 説明 |
|------|-----|------|
| calendar_events | 配列 | title, start, end, all_day |
| sleep_logs | 配列 | date, score, scheduled_sleep_time, mood |
| settings | オブジェクト | wake_up_time, sleep_duration_hours |
| today_override | オブジェクト \| null | date, sleepHour, sleepMinute, wakeHour, wakeMinute |

### 1.3 フロントが期待するが未実装の項目

| 項目 | DailyPlan 型での期待 | 現状 |
|------|---------------------|------|
| importance | high/medium/low（翌日の予定重要度） | 常に `'medium'` でハードコード |
| nextDayEvent | 翌日の主要予定名 | 常に `undefined` |

ホーム画面では「明日: {nextDayEvent}」「重要/普通/軽め」バッジを表示する UI があるが、LLM が返していないため機能していない。

---

## 2. 現状の課題

- 出力が曜日（`day`）のみで、日付（`date`）がない（インデックス依存でずれるリスク）
- 出力に `importance` と `next_day_event` が含まれていない
- 平日・休日の区別がない
- 準備時間（起床〜出発）をプロンプトに渡していない
- 睡眠不足の補填ルールが明示されていない
- 睡眠ログの「評価が悪い＝実質睡眠時間が短い」という解釈の指示がない

---

## 3. 代替プロンプト案（詳細版）

以下の条件に従い、今後1週間の起床時間と入眠時刻を提案するプロンプト案。

### 3.1 条件（プロンプトに含める指示）

```
- 起床から家を出る、または自宅での予定に取りかかるまでには、準備として最低○時間、理想的には○時間が必要です。
- 帰宅から就寝までは、就寝準備として最低○時間、理想的には○時間が必要です。
- 家からの通学時間または通勤時間は○時間です。
- 「オンライン」と記載されている予定は、通学時間または通勤時間は必要ありません。
- 自宅の位置は○です。この情報を元に、職場または学校以外の場所への移動時間を推定してください。
- 理想的な睡眠時間は7-8時間です。
- 平日の理想的な就寝時刻は23:00、理想的な起床時刻は6:00です。ただし、予定を優先してください。
- 休日の理想的な就寝時刻は24:00、理想的な起床時刻は8:00です。ただし、その週の平日の睡眠不足を補うよう長めの睡眠を取るよう提案してください。
- 十分な睡眠が取れない場合は、前後数日の睡眠時間を長めに取り、睡眠不足を補うようにしてください。
- 以下は今月の予定です。（ICS形式または構造化データ）
- 以下は過去1週間の睡眠時間の記録です。睡眠時刻が不足している場合は、それを補うように提案してください。
  十分な睡眠時間が取れている日でも、睡眠記録の評価が悪い場合は、実際の睡眠時間よりも短い睡眠しか取れていない可能性があると考えて提案してください。
```

### 3.2 出力形式（案）

```json
{
  "weekly_schedule": [
    {
      "date": "YYYY-MM-DD",
      "day": "曜日",
      "wake_up": "HH:MM",
      "bed_time": "HH:MM",
      "sleep_duration": "HH:MM",
      "importance": "high | medium | low",
      "next_day_event": "翌日の主要予定名またはnull",
      "advice": "その日の予定を受けての睡眠に関するアドバイスを簡潔に記載"
    }
  ]
}
```

- `date`: **必須**。YYYY-MM-DD 形式。曜日ではなく日付で返す（下記の理由による）
- `day`: 任意。月・火・水・木・金・土・日のいずれか（表示用。フロントで日付から算出も可）
- `wake_up`, `bed_time`: HH:MM 形式
- `sleep_duration`: 「H:MM」形式（例: 7:30）
- `importance`: 翌日の予定の重要度（会議・試験などは high）
- `next_day_event`: 翌日の最も重要な予定のタイトル（無ければ null）

**注意:** 出力は JSON のみ、マークダウン修飾なし、プレーンテキストで返す旨を明記する。

### 3.3 日付で返す設計（曜日ではなく）

出力では **曜日（day）ではなく日付（date: YYYY-MM-DD）を必須で返す** 方針とする。

**理由:**
- **誤解・ずれ防止**: 曜日だけだと LLM が「今日」を誤解した場合、7日分の対応関係がずれる。日付ならプロンプトで渡した「今日」との対応が明確になる
- **マッピングの安定性**: インデックスベースの対応付けだと順序ミスでずれるリスクがある。日付をキーにすれば `date === todayStr` で正確にマッチングできる
- **フロントとの親和性**: `getTodayPlan()` は `dailyPlans.find(d => d.date === todayStr)` で取得しており、日付が確実にあれば安全に動作する
- **曜日は算出可能**: 日付さえあれば曜日は `new Date(date).getDay()` でフロント側で算出できる。表示用であり主キーは日付で十分

**実装上の注意:** プロンプトに「今日の日付は YYYY-MM-DD」を明示的に渡し、各日の出力に `date` を必須とするよう指示する。

---

## 4. 入力データの対応状況

| 新プロンプトで必要な入力 | フロント | バックエンド | 対応 |
|-------------------------|----------|--------------|------|
| カレンダー予定 | ✅ | ✅ | 済 |
| 過去1週間の睡眠記録 | ✅ | ✅ | 済 |
| 起床〜出発の準備時間 | preparationMinutes あり | 未送付 | 要追加 |
| 帰宅〜就寝の準備時間 | なし | なし | 新規要 |
| 通勤・通学時間 | なし | なし | 新規要 |
| 自宅の位置 | なし | なし | 新規要 |

---

## 5. 段階的実装案

### フェーズ1: 既存データのみでプロンプト強化

- 出力に `date`（YYYY-MM-DD）を必須で返すよう指示（曜日ではなく日付で返す）
- 平日・休日の区別
- 睡眠不足の補填ルール（前後数日で補う）
- 睡眠ログの評価が悪い日は「実質睡眠が短い」と解釈する指示
- 出力に `importance` と `next_day_event` を追加
- 今日の日付・タイムゾーン（Asia/Tokyo）をプロンプトに含める

### フェーズ2: 設定の拡張

- `preparationMinutes`（起床〜出発）を API に送付し、プロンプトに含める
- 帰宅〜就寝の準備時間の設定項目を新規追加（例: `eveningPreparationMinutes`）
- `preparationMinutes` を元に「最低○時間、理想○時間」を LLM に渡す

### フェーズ3: より詳細なライフスタイル設定

- 通勤・通学時間の設定
- 自宅の位置（住所または緯度経度）の設定
- 「オンライン」予定の扱いの明示

---

## 6. プロンプト改善チェックリスト

- [ ] 出力に `date`（YYYY-MM-DD）を**必須**で返すよう指示（曜日ではなく日付で返す）
- [ ] 出力に `importance` を追加
- [ ] 出力に `next_day_event` を追加
- [ ] 今日の日付（YYYY-MM-DD）をプロンプトに含める
- [ ] タイムゾーン（Asia/Tokyo）を明記
- [ ] mood（気分）を睡眠ログの解釈に活用する指示を追加
- [ ] 平日・休日の理想就寝・起床時刻の区別
- [ ] 睡眠不足補填ルール（前後数日で補う）
- [ ] 評価が悪い日は実質睡眠が短い可能性がある旨の指示
- [ ] preparationMinutes を API に送付しプロンプトに含める
- [ ] 帰宅〜就寝の準備時間の設定追加
- [ ] 通勤時間の設定追加（任意）
- [ ] 自宅位置の設定追加（任意）

---

## 7. 修正が必要な箇所一覧

プロンプト改善（フェーズ1〜3）を行う際に修正が必要な箇所を洗い出した。

---

### 7.1 フェーズ1: 既存データのみでプロンプト強化

#### バックエンド

| ファイル | 修正内容 |
|----------|----------|
| `backend/app/infrastructure/llm/openrouter_client.py` | プロンプト全面改修。システム・ユーザープロンプトに以下を反映: 今日の日付・タイムゾーン（Asia/Tokyo）を渡す、平日・休日の区別、睡眠不足補填ルール、評価が悪い日は実質睡眠短い旨の指示。出力形式を `date`（必須）・`importance`・`next_day_event`・`wake_up`・`bed_time`・`sleep_duration` を含む形に変更 |
| `backend/app/presentation/schemas/plan.py` | `PlanRequest` に `today_date: str`（YYYY-MM-DD、オプション）を追加。バックエンドでサーバー日付をフォールバック可能 |
| `backend/app/domain/plan/value_objects.py` | `build_signature_hash` に `today_date` を追加し、署名に含める（日付跨ぎでキャッシュを区別するため） |
| `backend/app/application/plan/get_or_create_plan.py` | `GetOrCreatePlanInput` に `today_date` を追加。API から受け取るか、サーバー日付で補完。`build_signature_hash` と LLM 呼び出しに渡す |

#### フロントエンド

| ファイル | 修正内容 |
|----------|----------|
| `src/features/sleep-plan/sleepPlanStore.ts` | `fetchPlan` 内で `settings` に加えて `todayDate: getTodayDateStr()` を API リクエストに含める（バックエンドが受け取る場合） |
| `src/features/sleep-plan/types.ts` | `SleepSettingsSummary` は現状のまま。`SleepPlanRequest` に `todayDate?: string` を追加（任意） |
| `src/features/sleep-plan/api/sleepPlanApi.ts` | `PlanApiResponse` の型を拡張: 各要素に `date`, `importance`, `next_day_event`, `wake_up`/`bed_time` または `recommended_bedtime`/`recommended_wakeup` など。`planApiResponseToWeeklyPlan` を修正: インデックスベースではなく **日付（date）でマッピング**。`week_plan` と `weekly_schedule` の両対応、`importance`・`nextDayEvent` を LLM 出力から取得 |

#### データベース

| 対象 | 修正内容 |
|------|----------|
| `sleep_plan_cache` テーブル | **変更なし**。`plan_json` は新形式の JSON をそのまま保存するだけ |

#### テスト

| ファイル | 修正内容 |
|----------|----------|
| `backend/tests/test_signature.py` | `today_date` を `build_signature_hash` に渡すテストを追加 |
| `backend/tests/test_plan_usecase.py` | モックの plan に `date`, `importance`, `next_day_event` を含める。`today_date` を input に渡す |
| `backend/tests/test_plan_api.py` | モックレスポンスを新形式に合わせる。`today_date` をリクエストに含めるテストを追加 |

---

### 7.2 フェーズ2: 設定の拡張（preparationMinutes 等）

#### フロントエンド

| ファイル | 修正内容 |
|----------|----------|
| `src/features/sleep-plan/types.ts` | `SleepSettingsSummary` に `preparationMinutes: number` を追加 |
| `src/features/sleep-plan/sleepPlanStore.ts` | `settings` に `preparationMinutes` を含める（`useSleepSettingsStore` から取得） |
| `src/features/sleep-plan/api/sleepPlanApi.ts` | `toSnakeCaseBody` で `settings.preparation_minutes` を送信 |

#### バックエンド

| ファイル | 修正内容 |
|----------|----------|
| `backend/app/presentation/schemas/plan.py` | `PlanRequest` の `settings` で `preparation_minutes` を受け付ける（任意） |
| `backend/app/domain/plan/value_objects.py` | `settings` に `preparation_minutes` が含まれるため、署名ハッシュは自動的に反映（追加対応不要） |
| `backend/app/infrastructure/llm/openrouter_client.py` | プロンプトに「起床〜出発まで準備に最低○分、理想○分」の文言を `preparationMinutes` から生成して含める |

#### データベース

| 対象 | 修正内容 |
|------|----------|
| `sleep_settings` テーブル | **変更なし**。`preparation_minutes` は既存カラム |

#### 帰宅〜就寝の準備時間（新規）

| 対象 | 修正内容 |
|------|----------|
| `sleep_settings` テーブル | `evening_preparation_minutes` カラムを追加（migration） |
| `backend/app/infrastructure/persistence/models/sleep_settings.py` | `evening_preparation_minutes` を追加 |
| `backend/app/presentation/schemas/settings.py` | `SettingsResponse` / `SettingsPutRequest` に `evening_preparation_minutes` を追加 |
| フロント `SleepSettings` / 設定画面 | 帰宅〜就寝の準備時間の入力 UI を追加 |
| `SleepSettingsSummary` | `eveningPreparationMinutes` を追加 |
| プロンプト | 「帰宅〜就寝まで最低○分、理想○分」を反映 |

---

### 7.3 フェーズ3: より詳細なライフスタイル設定

| 対象 | 修正内容 |
|------|----------|
| `sleep_settings` テーブル | `commute_minutes`, `home_location`（または `home_address`）を追加（migration） |
| バックエンド モデル・スキーマ | 上記カラムを追加 |
| フロント 設定画面 | 通勤時間・自宅位置の入力 UI を追加 |
| `SleepSettingsSummary` | `commuteMinutes`, `homeLocation` を追加 |
| `build_signature_hash` | 上記が `settings` に含まれるため、自動反映 |
| プロンプト | 「通勤○分」「オンラインは通勤不要」「自宅位置から移動時間推定」を反映 |

---

### 7.4 修正ファイル一覧（フェーズ1のみ・簡易版）

```
backend/
  app/
    infrastructure/llm/openrouter_client.py   # プロンプト改修・出力形式
    presentation/schemas/plan.py              # today_date 追加
    domain/plan/value_objects.py              # today_date を署名に含める
    application/plan/get_or_create_plan.py    # today_date の受け渡し
  tests/
    test_signature.py
    test_plan_usecase.py
    test_plan_api.py

src/
  features/sleep-plan/
    types.ts                                  # SleepPlanRequest.todayDate（任意）
    sleepPlanStore.ts                         # todayDate を API に渡す
    api/sleepPlanApi.ts                       # レスポンス変換・日付マッピング
```

---

## 8. 参照

- 現状実装: `backend/app/infrastructure/llm/openrouter_client.py`（`generate_week_plan`）
- フロント型定義: `src/features/sleep-plan/types.ts`
- API レスポンス変換: `src/features/sleep-plan/api/sleepPlanApi.ts`（`planApiResponseToWeeklyPlan`）
- プランキャッシュ: `docs/plan-cache.md`
- バックエンド設計: `docs/backend-design.md`
