/**
 * 睡眠監視機能の型定義
 */

/** 監視フェーズ */
export type MonitorPhase = 'idle' | 'phase1' | 'phase2' | 'phase3' | 'completed';

/** 警告レベル */
export type WarningLevel = 'none' | 'normal' | 'strict';

/** 予定の重要度 */
export type EventImportance = 'high' | 'low' | 'none';

/** 環境データ */
export interface EnvironmentData {
  /** 照度（ルクス） */
  lightLux: number | null;
  /** 音圧レベル（dB） */
  noiseDb: number | null;
  /** 光がNGラインを超えているか */
  isLightExceeded: boolean;
  /** 音がNGラインを超えているか */
  isNoiseExceeded: boolean;
}

/** 使用状況データ */
export interface UsageData {
  /** 現フェーズでの累積操作時間（分） */
  usageMinutes: number;
  /** アプリ外にいるかどうか */
  isOutsideApp: boolean;
  /** 最後にチェックした時刻 */
  lastCheckTime: number;
}

/** 警告情報 */
export interface WarningInfo {
  /** 警告が発動したフェーズ */
  phase: MonitorPhase;
  /** 警告レベル */
  level: WarningLevel;
  /** 警告メッセージ */
  message: string;
  /** 発動時刻 */
  triggeredAt: number;
}

/** 睡眠スコア */
export interface SleepScore {
  /** 合計スコア (0-100) */
  total: number;
  /** スマホ操作による減点 */
  usagePenalty: number;
  /** 環境要因による減点 */
  environmentPenalty: number;

  /** Phase1で警告が発動したか */
  phase1Warning: boolean;
  /** Phase2で警告が発動したか */
  phase2Warning: boolean;
  /** 就寝時に部屋が明るかったか */
  lightExceeded: boolean;
  /** 就寝時に部屋がうるさかったか */
  noiseExceeded: boolean;
}

/** 監視全体の状態 */
export interface MonitorState {
  /** 就寝予定時刻 (Date.getTime()) */
  sleepTime: number | null;
  /** 現在のフェーズ */
  currentPhase: MonitorPhase;
  /** 監視が有効かどうか */
  isMonitoring: boolean;
  /** 環境データ */
  environment: EnvironmentData;
  /** 使用状況データ */
  usage: UsageData;
  /** 発動した警告リスト */
  warnings: WarningInfo[];
  /** 現在のスコア */
  score: SleepScore;
  /** 監視開始時刻 */
  monitorStartTime: number | null;
}
