import { useEffect } from 'react';
import { useSleepSettingsStore } from '../sleepSettingsStore';
import {
    scheduleBedtimeReminder,
    cancelBedtimeReminder,
} from '@shared/lib';

/**
 * 就寝リマインダー通知のスケジュールを管理するフック
 *
 * - reminderEnabled が ON → 就寝時刻の1時間前に通知を予約
 * - reminderEnabled が OFF → 予約をキャンセル
 * - 起床時刻・睡眠時間が変わったら再スケジュール
 *
 * アプリのルートレイアウト (_layout.tsx) で呼び出すこと。
 */
export const useScheduleReminder = (): void => {
    const reminderEnabled = useSleepSettingsStore(s => s.reminderEnabled);
    const calculatedSleepHour = useSleepSettingsStore(s => s.calculatedSleepHour);
    const calculatedSleepMinute = useSleepSettingsStore(s => s.calculatedSleepMinute);

    useEffect(() => {
        if (reminderEnabled) {
            void scheduleBedtimeReminder(calculatedSleepHour, calculatedSleepMinute);
        } else {
            void cancelBedtimeReminder();
        }
    }, [reminderEnabled, calculatedSleepHour, calculatedSleepMinute]);
};
