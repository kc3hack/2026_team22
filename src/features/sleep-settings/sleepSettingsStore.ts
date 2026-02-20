import { create } from 'zustand';
import type { SleepSettings, TodayOverride } from './types';

interface SleepSettingsActions {
  /** 起床時刻を設定 */
  setWakeUpTime: (hour: number, minute: number) => void;
  /** 睡眠時間を設定 */
  setSleepDuration: (hours: number) => void;
  /** 就寝予定時刻をDate.getTime()で取得 */
  getSleepTimeToday: () => number;
  /** レジリエンスウィンドウ時間を設定 */
  setResilienceWindow: (minutes: number) => void;
  /** ミッション設定を更新 */
  setMissionSettings: (enabled: boolean, target: string) => void;
  /** 起床〜出発までの所要時間を設定 */
  setPreparationTime: (minutes: number) => void;
  /** ICS URLを設定 */
  setIcsUrl: (url: string) => void;

  /** 今日だけのオーバーライドを設定 */
  setTodayOverride: (override: Omit<TodayOverride, 'date'>) => void;
  /** オーバーライドをクリア */
  clearTodayOverride: () => void;
  /** オーバーライド考慮の有効な就寝時刻を取得 */
  getEffectiveSleepTime: () => { hour: number; minute: number };
  /** オーバーライド考慮の有効な起床時刻を取得 */
  getEffectiveWakeTime: () => { hour: number; minute: number };
}

/**
 * 就寝時刻を計算（起床時刻 - 睡眠時間）
 */
const calculateSleepTime = (
  wakeUpHour: number,
  wakeUpMinute: number,
  sleepDurationHours: number
): { hour: number; minute: number } => {
  let totalMinutes = wakeUpHour * 60 + wakeUpMinute - sleepDurationHours * 60;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  return {
    hour: Math.floor(totalMinutes / 60) % 24,
    minute: totalMinutes % 60,
  };
};

/**
 * 睡眠設定ストア
 * 起床時刻から就寝時刻を逆算
 */
export const useSleepSettingsStore = create<SleepSettings & SleepSettingsActions>((set, get) => {
  const defaultWakeUp = { hour: 7, minute: 0 };
  const defaultDuration = 8;
  const defaultSleep = calculateSleepTime(
    defaultWakeUp.hour,
    defaultWakeUp.minute,
    defaultDuration
  );

  // New settings defaults
  const defaultResilienceWindow = 20; // 20 minutes default
  const defaultMissionEnabled = false;
  const defaultMissionTarget = 'washroom';
  const defaultPreparationMinutes = 60; // 1 hour default
  const defaultIcsUrl = 'https://calendar.google.com/calendar/ical/e640656856d5f692768a50a4d0c65492146a4353ba65bfe23aa4796492b360ba%40group.calendar.google.com/private-aa715fd8bcfa902595f47d5aeb095b9c/basic.ics';

  return {
    wakeUpHour: defaultWakeUp.hour,
    wakeUpMinute: defaultWakeUp.minute,
    sleepDurationHours: defaultDuration,
    calculatedSleepHour: defaultSleep.hour,
    calculatedSleepMinute: defaultSleep.minute,
    resilienceWindowMinutes: defaultResilienceWindow,
    missionEnabled: defaultMissionEnabled,
    missionTarget: defaultMissionTarget,
    preparationMinutes: defaultPreparationMinutes,
    icsUrl: defaultIcsUrl,

    todayOverride: null as TodayOverride | null,

    setIcsUrl: (url: string) => set({ icsUrl: url }),

    setWakeUpTime: (hour: number, minute: number) => {
      const sleep = calculateSleepTime(hour, minute, get().sleepDurationHours);
      set({
        wakeUpHour: hour,
        wakeUpMinute: minute,
        calculatedSleepHour: sleep.hour,
        calculatedSleepMinute: sleep.minute,
      });
    },

    setSleepDuration: (hours: number) => {
      const sleep = calculateSleepTime(get().wakeUpHour, get().wakeUpMinute, hours);
      set({
        sleepDurationHours: hours,
        calculatedSleepHour: sleep.hour,
        calculatedSleepMinute: sleep.minute,
      });
    },

    setResilienceWindow: (minutes: number) => set({ resilienceWindowMinutes: minutes }),
    setMissionSettings: (enabled: boolean, target: string) => set({ missionEnabled: enabled, missionTarget: target }),
    setPreparationTime: (minutes: number) => set({ preparationMinutes: minutes }),

    getSleepTimeToday: () => {
      const now = new Date();
      const state = get();
      const sleepTime = new Date(now);
      sleepTime.setHours(state.calculatedSleepHour, state.calculatedSleepMinute, 0, 0);

      // 就寝時刻が現在より前なら翌日に設定
      if (sleepTime.getTime() <= now.getTime()) {
        sleepTime.setDate(sleepTime.getDate() + 1);
      }
      return sleepTime.getTime();
    },

    setTodayOverride: (override) => {
      const today = new Date().toISOString().slice(0, 10);
      set({ todayOverride: { ...override, date: today } });
    },

    clearTodayOverride: () => set({ todayOverride: null }),

    getEffectiveSleepTime: () => {
      const state = get();
      const today = new Date().toISOString().slice(0, 10);
      if (state.todayOverride && state.todayOverride.date === today) {
        return { hour: state.todayOverride.sleepHour, minute: state.todayOverride.sleepMinute };
      }
      return { hour: state.calculatedSleepHour, minute: state.calculatedSleepMinute };
    },

    getEffectiveWakeTime: () => {
      const state = get();
      const today = new Date().toISOString().slice(0, 10);
      if (state.todayOverride && state.todayOverride.date === today) {
        return { hour: state.todayOverride.wakeHour, minute: state.todayOverride.wakeMinute };
      }
      return { hour: state.wakeUpHour, minute: state.wakeUpMinute };
    },
  };
});
