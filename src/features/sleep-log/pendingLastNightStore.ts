/**
 * アプリが記録した「昨夜分の仮データ」を保持するストア。
 * 就寝前モニター（照度など）の集計結果をここにセットし、
 * 朝の振り返りで気分を選んだタイミングで addLog に渡してからクリアする。
 */
import { create } from 'zustand';

export interface PendingLastNightData {
  /** 記録日 (YYYY-MM-DD) */
  date: string;
  /** スコア (0-100) */
  score: number;
  scheduledSleepTime: number;
  usagePenalty: number;
  /** スマホ使用時間（分） */
  usageMinutes: number;
  environmentPenalty: number;
  phase1Warning: boolean;
  phase2Warning: boolean;
  lightExceeded: boolean;
  noiseExceeded: boolean;
}

interface PendingLastNightState {
  /** 未保存の昨夜分。null ならアプリは記録していない（手動フォーム用） */
  pending: PendingLastNightData | null;
  setPending: (data: PendingLastNightData) => void;
  clearPending: () => void;
}

export const usePendingLastNightStore = create<PendingLastNightState>(set => ({
  pending: null,
  setPending: data => set({ pending: data }),
  clearPending: () => set({ pending: null }),
}));
