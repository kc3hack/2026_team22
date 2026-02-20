import { create } from 'zustand';
import type { SleepLogEntry } from './types';
import {
  fetchSleepLogsFromApi,
  createSleepLogViaApi,
  updateSleepLogMoodViaApi,
} from './sleepLogApi';

interface SleepLogState {
  /** ログ一覧（新しい順） */
  logs: SleepLogEntry[];
  /** API 通信中フラグ */
  isLoading: boolean;
  /** 最終取得日時 */
  lastFetchedAt: number | null;
  /** 取得失敗時のエラーメッセージ */
  error: string | null;
}

interface SleepLogActions {
  /** バックエンドからログ一覧を取得して store を更新 */
  fetchLogs: (limit?: number) => Promise<void>;
  /** ログを追加（API POST → store 更新） */
  addLog: (entry: Omit<SleepLogEntry, 'id' | 'createdAt' | 'mood'>) => Promise<void>;
  /** ログの気分を設定（API PATCH → store 更新） */
  setMood: (logId: string, mood: number) => Promise<void>;
  /** ログを削除（ローカルのみ） */
  removeLog: (id: string) => void;
  /** 全ログをクリア（ローカルのみ） */
  clearLogs: () => void;
  /** エラーをクリア */
  clearError: () => void;
}

/**
 * 睡眠ログストア
 * バックエンド API と連携してスコア履歴の保存と取得を管理
 */
export const useSleepLogStore = create<SleepLogState & SleepLogActions>((set, get) => ({
  logs: [],
  isLoading: false,
  lastFetchedAt: null,
  error: null,

  fetchLogs: async (limit = 7) => {
    set({ isLoading: true, error: null });
    try {
      const logs = await fetchSleepLogsFromApi(limit);
      set({ logs, isLoading: false, lastFetchedAt: Date.now(), error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ログの取得に失敗しました';
      console.warn('[sleepLogStore] fetchLogs failed:', err);
      set({ isLoading: false, error: message });
    }
  },

  addLog: async entry => {
    try {
      const created = await createSleepLogViaApi(entry);
      set(state => ({
        logs: [created, ...state.logs],
      }));
    } catch (err) {
      console.warn('[sleepLogStore] addLog failed:', err);
      throw err;
    }
  },

  setMood: async (logId, mood) => {
    try {
      const updated = await updateSleepLogMoodViaApi(logId, mood);
      set(state => ({
        logs: state.logs.map(log => (log.id === updated.id ? updated : log)),
      }));
    } catch (err) {
      console.warn('[sleepLogStore] setMood failed:', err);
      throw err;
    }
  },

  removeLog: id =>
    set(state => ({
      logs: state.logs.filter(log => log.id !== id),
    })),

  clearLogs: () => set({ logs: [] }),
  clearError: () => set({ error: null }),
}));
