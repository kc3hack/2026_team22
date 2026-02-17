/**
 * 照度センサーのデータ型
 */
export interface LightSensorData {
  /** 照度値（ルクス） */
  illuminance: number;
}

/**
 * 睡眠状態の種類
 */
export type SleepState = 'awake' | 'preparing' | 'sleeping';

/**
 * 睡眠環境の評価
 */
export interface SleepEnvironment {
  /** 現在の照度 */
  currentLux: number;
  /** 睡眠に適した環境かどうか */
  isSuitableForSleep: boolean;
  /** 推奨メッセージ */
  recommendation: string;
  /** 環境スコア (0-100) */
  score: number;
}
