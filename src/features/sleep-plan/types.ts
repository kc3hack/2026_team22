/**
 * 週間睡眠プランの型定義
 */

/** 予定の重要度 */
export type PlanImportance = 'high' | 'medium' | 'low';

/** 1日分の推奨プラン */
export interface DailyPlan {
  /** 日付 (YYYY-MM-DD) */
  date: string;
  /** 曜日 (例: "月", "火") */
  dayOfWeek: string;
  /** 推奨就寝時刻 (HH:mm) */
  recommendedSleepTime: string;
  /** 推奨起床時刻 (HH:mm) */
  recommendedWakeTime: string;
  /** 推奨睡眠時間（時間） */
  sleepDurationHours: number;
  /** 翌日の予定の重要度 */
  importance: PlanImportance;
  /** AIによるアドバイスメッセージ */
  advice: string;
  /** 翌日の主要な予定名 */
  nextDayEvent?: string;
}

/** 週間睡眠プラン */
export interface WeeklySleepPlan {
  /** プランID */
  id: string;
  /** 7日分のプラン */
  dailyPlans: DailyPlan[];
  /** プラン作成日時 (ISO 8601) */
  createdAt: string;
  /** キャッシュヒットしたかどうか */
  cacheHit: boolean;
}

/** APIリクエスト型 */
export interface SleepPlanRequest {
  /** カレンダー予定一覧 */
  calendarEvents: CalendarEventSummary[];
  /** 睡眠ログ（直近7日分） */
  sleepLogs: SleepLogSummary[];
  /** 睡眠設定 */
  settings: SleepSettingsSummary;
  /** 今日だけのオーバーライド（null なら無し） */
  todayOverride?: TodayOverrideSummary | null;
}

/** 今日だけの一時的な時刻オーバーライド（リクエスト用） */
export interface TodayOverrideSummary {
  /** 有効日 (YYYY-MM-DD) */
  date: string;
  /** 就寝時刻（時） */
  sleepHour: number;
  /** 就寝時刻（分） */
  sleepMinute: number;
  /** 起床時刻（時） */
  wakeHour: number;
  /** 起床時刻（分） */
  wakeMinute: number;
}

/** カレンダー予定の要約（リクエスト用） */
export interface CalendarEventSummary {
  /** 予定名 */
  title: string;
  /** 開始日時 (ISO 8601) */
  start: string;
  /** 終了日時 (ISO 8601) */
  end: string;
  /** 終日かどうか */
  allDay?: boolean;
}

/** 睡眠ログの要約（リクエスト用） */
export interface SleepLogSummary {
  /** 日付 (YYYY-MM-DD) */
  date: string;
  /** スコア (0-100) */
  score: number;
  /** 就寝予定時刻 (ISO 8601) */
  scheduledSleepTime: string;
}

/** 睡眠設定の要約（リクエスト用） */
export interface SleepSettingsSummary {
  /** 起床時刻 (HH:mm) */
  wakeUpTime: string;
  /** 希望睡眠時間（時間） */
  sleepDurationHours: number;
}

/** ストア状態 */
export interface SleepPlanState {
  /** 現在の週間プラン */
  plan: WeeklySleepPlan | null;
  /** 取得リクエスト中かどうか */
  isFetching: boolean;
  /**
   * ローディングアニメーションを表示するか。
   * キャッシュヒット（短時間で返る）では true にならず、AI生成（長時間）のときのみ true になる。
   */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** 最終取得日時 (Date.getTime()) */
  lastFetchedAt: number | null;
  /** 最終取得成功時のローカル日付 (YYYY-MM-DD) */
  lastFetchedDate: string | null;
}
