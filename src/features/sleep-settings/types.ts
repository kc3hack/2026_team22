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
}
