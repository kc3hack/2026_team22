import { create } from 'zustand';
import type { SleepSettings } from './types';

interface SleepSettingsActions {
  /** 起床時刻を設定 */
  setWakeUpTime: (hour: number, minute: number) => void;
  /** 睡眠時間を設定 */
  setSleepDuration: (hours: number) => void;
  /** 就寝予定時刻をDate.getTime()で取得 */
  getSleepTimeToday: () => number;
  /** リマインダー通知のON/OFF切り替え */
  setReminderEnabled: (enabled: boolean) => void;
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

  return {
    wakeUpHour: defaultWakeUp.hour,
    wakeUpMinute: defaultWakeUp.minute,
    sleepDurationHours: defaultDuration,
    calculatedSleepHour: defaultSleep.hour,
    calculatedSleepMinute: defaultSleep.minute,
    reminderEnabled: true,

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

    setReminderEnabled: (enabled: boolean) => set({ reminderEnabled: enabled }),
  };
});
