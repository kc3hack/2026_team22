/**
 * 睡眠ログの型定義
 */

/** 1日分の睡眠ログ */
export interface SleepLogEntry {
  /** ログID */
  id: string;
  /** 記録日 (YYYY-MM-DD) */
  date: string;
  /** 就寝予定時刻 */
  scheduledSleepTime: number;
  /** スコア (0-100) */
  score: number;
  /** スマホ操作減点 */
  usagePenalty: number;
  /** 環境減点 */
  environmentPenalty: number;

  /** Phase1警告が発動したか */
  phase1Warning: boolean;
  /** Phase2警告が発動したか */
  phase2Warning: boolean;
  /** 就寝時に明るかったか */
  lightExceeded: boolean;
  /** 就寝時にうるさかったか */
  noiseExceeded: boolean;
  /** 朝の気分フィードバック (1〜5, 未入力は null) */
  mood: number | null;
  /** 作成日時 */
  createdAt: number;
}
