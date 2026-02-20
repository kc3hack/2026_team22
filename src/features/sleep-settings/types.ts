/**
 * 睡眠設定の型定義
 */

/** 睡眠設定 */
export interface SleepSettings {
  /** 起床時刻（時） */
  wakeUpHour: number;
  /** 起床時刻（分） */
  wakeUpMinute: number;
  /** 睡眠時間（時間） */
  sleepDurationHours: number;
  /** 就寝予定時刻（自動計算） */
  calculatedSleepHour: number;
  /** 就寝予定時刻の分（自動計算） */
  calculatedSleepMinute: number;
  /* HEAD properties */
  /** レジリエンスウィンドウ（分）：Phase 1の継続時間 */
  resilienceWindowMinutes: number;
  /** ミッション有効 */
  missionEnabled: boolean;
  /** ミッション対象（例：'washroom'） */
  missionTarget: string;
  /** 起床〜出発までの所要時間（分） */
  preparationMinutes: number;

  /* feat/front-end properties */
  /** 今日だけの一時的なオーバーライド */
  todayOverride: TodayOverride | null;
}

/** 今日だけの一時的な時刻オーバーライド */
export interface TodayOverride {
  /** 就寝時刻（時） */
  sleepHour: number;
  /** 就寝時刻（分） */
  sleepMinute: number;
  /** 起床時刻（時） */
  wakeHour: number;
  /** 起床時刻（分） */
  wakeMinute: number;
  /** 有効日 (YYYY-MM-DD) — 翌日に自動期限切れ */
  date: string;
}
