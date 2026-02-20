/**
 * 週間睡眠プラン Zustand ストア
 * プランの取得・キャッシュ管理を一元化
 */

import { create } from 'zustand';
import type { WeeklySleepPlan, SleepPlanState, DailyPlan } from './types';
import { fetchSleepPlan } from './api/sleepPlanApi';

/** リクエスト間の最小間隔（ミリ秒）: 5分 */
const MIN_FETCH_INTERVAL = 5 * 60 * 1000;

interface SleepPlanActions {
    /** プランを取得（キャッシュ期限内ならスキップ） */
    fetchPlan: (force?: boolean) => Promise<void>;
    /** 今日のプランを取得 */
    getTodayPlan: () => DailyPlan | null;
    /** ストアをリセット */
    reset: () => void;
}

const initialState: SleepPlanState = {
    plan: null,
    isLoading: false,
    error: null,
    lastFetchedAt: null,
};

export const useSleepPlanStore = create<SleepPlanState & SleepPlanActions>((set, get) => ({
    ...initialState,

    fetchPlan: async (force = false) => {
        const state = get();

        // 重複リクエスト防止
        if (state.isLoading) return;

        // キャッシュ期限チェック（強制更新でなければ）
        if (
            !force &&
            state.lastFetchedAt &&
            Date.now() - state.lastFetchedAt < MIN_FETCH_INTERVAL
        ) {
            return;
        }

        set({ isLoading: true, error: null });

        try {
            // TODO: 実データに差し替え時、ストアからカレンダー・ログ・設定を取得してリクエスト作成
            const plan: WeeklySleepPlan = await fetchSleepPlan({
                calendarEvents: [],
                sleepLogs: [],
                settings: {
                    wakeUpTime: '07:00',
                    sleepDurationHours: 8,
                },
            });

            set({
                plan,
                isLoading: false,
                error: null,
                lastFetchedAt: Date.now(),
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'プランの取得に失敗しました';
            set({ isLoading: false, error: message });
        }
    },

    getTodayPlan: () => {
        const { plan } = get();
        if (!plan) return null;

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        return plan.dailyPlans.find(d => d.date === todayStr) ?? null;
    },

    reset: () => set(initialState),
}));
