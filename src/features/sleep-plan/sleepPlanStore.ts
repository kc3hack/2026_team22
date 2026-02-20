/**
 * 週間睡眠プラン Zustand ストア
 * プランの取得・キャッシュ管理を一元化
 *
 * タイミング制御:
 *   - force=true → 必ず API 呼び出し
 *   - それ以外 → 毎回 API 呼び出し（バックエンドで同じ入力ならキャッシュを返すためスロットル不要）
 */

import { create } from 'zustand';
import type {
  WeeklySleepPlan,
  SleepPlanState,
  DailyPlan,
  TodayOverrideSummary,
  SleepLogSummary,
} from './types';
import { fetchSleepPlan } from './api/sleepPlanApi';
import { googleCalendar } from '@shared/lib/googleCalendar';
import { useSleepSettingsStore } from '../sleep-settings/sleepSettingsStore';
import { useSleepLogStore } from '../sleep-log/sleepLogStore';

/** 端末ローカルの今日の日付を YYYY-MM-DD で返す */
const getTodayDateStr = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

interface SleepPlanActions {
  /** プランを取得（キャッシュ期限内ならスキップ） */
  fetchPlan: (force?: boolean) => Promise<void>;
  /** 今日のプランを取得 */
  getTodayPlan: () => DailyPlan | null;
  /** ストアをリセット */
  reset: () => void;
}

/** この時間（ms）を超えて応答が返らなければ「AI生成中」とみなしローディングを表示する */
const LOADING_DELAY_MS = 1000;

const initialState: SleepPlanState = {
  plan: null,
  isFetching: false,
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  lastFetchedDate: null,
};

export const useSleepPlanStore = create<SleepPlanState & SleepPlanActions>((set, get) => ({
  ...initialState,

  fetchPlan: async (force = false) => {
    const state = get();

    // 重複リクエスト防止
    if (state.isFetching) return;

    const todayStr = getTodayDateStr();
    set({ isFetching: true, error: null });

    // キャッシュヒット（短時間で返る）ではローディングを出さず、AI生成（長時間）のときだけ表示
    const loadingDelayId = setTimeout(() => {
      if (get().isFetching) set({ isLoading: true });
    }, LOADING_DELAY_MS);

    try {
      // ── 設定ストアから実データを取得 ──
      const settingsState = useSleepSettingsStore.getState();
      const {
        icsUrl,
        sleepDurationHours,
        wakeUpHour,
        wakeUpMinute,
        todayOverride: rawOverride,
      } = settingsState;

      // 起床時刻を HH:mm にフォーマット
      const wakeUpTime = `${String(wakeUpHour).padStart(2, '0')}:${String(wakeUpMinute).padStart(2, '0')}`;

      // ── todayOverride: 今日の日付のもののみ有効 ──
      let todayOverride: TodayOverrideSummary | null = null;
      if (rawOverride && rawOverride.date === todayStr) {
        todayOverride = {
          date: rawOverride.date,
          sleepHour: rawOverride.sleepHour,
          sleepMinute: rawOverride.sleepMinute,
          wakeHour: rawOverride.wakeHour,
          wakeMinute: rawOverride.wakeMinute,
        };
      }

      // ── 睡眠ログから直近7件を SleepLogSummary に変換 ──
      const logsState = useSleepLogStore.getState();
      const sleepLogs: SleepLogSummary[] = logsState.logs.slice(0, 7).map(log => ({
        date: log.date,
        score: log.score,
        scheduledSleepTime: new Date(log.scheduledSleepTime).toISOString(),
      }));

      // ── カレンダー予定を ICS から取得 ──
      if (icsUrl) {
        googleCalendar.configure({ icsUrl });
      }
      const rawEvents = await googleCalendar.getEvents();

      const calendarEvents = rawEvents.map(e => ({
        title: e.title,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
        allDay: e.allDay,
      }));

      // ── API 呼び出し ──
      const plan: WeeklySleepPlan = await fetchSleepPlan(
        {
          calendarEvents,
          sleepLogs,
          settings: {
            wakeUpTime,
            sleepDurationHours,
          },
          todayOverride,
        },
        force,
      );

      set({
        plan,
        isFetching: false,
        isLoading: false,
        error: null,
        lastFetchedAt: Date.now(),
        lastFetchedDate: todayStr,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'プランの取得に失敗しました';
      set({ isFetching: false, isLoading: false, error: message });
    } finally {
      clearTimeout(loadingDelayId);
    }
  },

  getTodayPlan: () => {
    const { plan } = get();
    if (!plan) return null;
    const todayStr = getTodayDateStr();
    return plan.dailyPlans.find(d => d.date === todayStr) ?? null;
  },

  reset: () => set(initialState),
}));
