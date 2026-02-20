import { create } from 'zustand';
import type { SleepLogEntry } from './types';
import { mockSleepLogs } from './mockData';

interface SleepLogState {
  /** ログ一覧（新しい順） */
  logs: SleepLogEntry[];
}

interface SleepLogActions {
  /** ログを追加 */
  addLog: (entry: Omit<SleepLogEntry, 'id' | 'createdAt' | 'mood'>) => void;
  /** ログの気分を設定 */
  setMood: (logId: string, mood: number) => void;
  /** ログを削除 */
  removeLog: (id: string) => void;
  /** 全ログをクリア */
  clearLogs: () => void;
}



/**
 * 睡眠ログストア
 * スコア履歴の保存と取得を管理
 * TODO: AsyncStorageで永続化
 */
export const useSleepLogStore = create<SleepLogState & SleepLogActions>(set => ({
  logs: mockSleepLogs,

  addLog: entry => {
    const newLog: SleepLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      mood: null,
      createdAt: Date.now(),
    };
    set(state => ({
      logs: [newLog, ...state.logs],
    }));
  },

  removeLog: id =>
    set(state => ({
      logs: state.logs.filter(log => log.id !== id),
    })),

  setMood: (logId, mood) =>
    set(state => ({
      logs: state.logs.map(log =>
        log.id === logId ? { ...log, mood } : log,
      ),
    })),

  clearLogs: () => set({ logs: [] }),
}));
