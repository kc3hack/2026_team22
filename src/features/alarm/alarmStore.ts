import { create } from 'zustand';
import type { AlarmPhase } from './types';

interface AlarmState {
    isAlarmRinging: boolean;
    currentPhase: AlarmPhase;
    volume: number;
    isSnoozed: boolean;
    /** アラーム開始時刻（タイムスタンプ） */
    alarmStartTime: number | null;
}

interface AlarmActions {
    startAlarm: () => void;
    stopAlarm: () => void;
    snoozeAlarm: () => void;
    setPhase: (phase: AlarmPhase) => void;
    setVolume: (volume: number) => void;
    reset: () => void;
}

const initialState: AlarmState = {
    isAlarmRinging: false,
    currentPhase: 'idle',
    volume: 0.0,
    isSnoozed: false,
    alarmStartTime: null,
};

export const useAlarmStore = create<AlarmState & AlarmActions>((set) => ({
    ...initialState,

    startAlarm: () => set({
        isAlarmRinging: true,
        currentPhase: 'gentle',
        volume: 0.2, // Phase 1 初期音量
        isSnoozed: false,
        alarmStartTime: Date.now(),
    }),

    stopAlarm: () => set({ ...initialState }),

    snoozeAlarm: () => set({
        isAlarmRinging: false,
        isSnoozed: true,
    }),

    setPhase: (phase) => set({ currentPhase: phase }),

    setVolume: (volume) => set({ volume }),

    reset: () => set({ ...initialState }),
}));
