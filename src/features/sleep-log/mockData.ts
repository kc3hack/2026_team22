import type { SleepLogEntry } from './types';

const NOW = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

export const mockSleepLogs: SleepLogEntry[] = [
    // 1. 完璧な睡眠 (昨晩)
    {
        id: 'log-1',
        date: '2026-02-18',
        scheduledSleepTime: NOW - DAY_MS, // 昨日の就寝時間
        score: 100,
        usagePenalty: 0,
        environmentPenalty: 0,

        phase1Warning: false,
        phase2Warning: false,
        lightExceeded: false,
        noiseExceeded: false,
        mood: null,
        createdAt: NOW - DAY_MS + 8 * 60 * 60 * 1000, // 今朝作成
    },
    // 2. 少しスマホを触ってしまった (2日前)
    {
        id: 'log-2',
        date: '2026-02-17',
        scheduledSleepTime: NOW - 2 * DAY_MS,
        score: 85,
        usagePenalty: 15,
        environmentPenalty: 0,

        phase1Warning: true,
        phase2Warning: false,
        lightExceeded: false,
        noiseExceeded: false,
        mood: 4,
        createdAt: NOW - 2 * DAY_MS + 8 * 60 * 60 * 1000,
    },
    // 3. 環境が悪かった日 (3日前)
    {
        id: 'log-3',
        date: '2026-02-16',
        scheduledSleepTime: NOW - 3 * DAY_MS,
        score: 60,
        usagePenalty: 0,
        environmentPenalty: 40,

        phase1Warning: false,
        phase2Warning: false,
        lightExceeded: true,
        noiseExceeded: true,
        mood: 2,
        createdAt: NOW - 3 * DAY_MS + 8 * 60 * 60 * 1000,
    },
    // 4. 最悪の日 (4日前)
    {
        id: 'log-4',
        date: '2026-02-15',
        scheduledSleepTime: NOW - 4 * DAY_MS,
        score: 30,
        usagePenalty: 50,
        environmentPenalty: 20,

        phase1Warning: true,
        phase2Warning: true,
        lightExceeded: true,
        noiseExceeded: false,
        mood: 1,
        createdAt: NOW - 4 * DAY_MS + 8 * 60 * 60 * 1000,
    },
    // 5. 普通の日 (5日前)
    {
        id: 'log-5',
        date: '2026-02-14',
        scheduledSleepTime: NOW - 5 * DAY_MS,
        score: 75,
        usagePenalty: 25,
        environmentPenalty: 0,

        phase1Warning: true,
        phase2Warning: false,
        lightExceeded: false,
        noiseExceeded: false,
        mood: 3,
        createdAt: NOW - 5 * DAY_MS + 8 * 60 * 60 * 1000,
    },
    // 6. まあまあの日 (6日前)
    {
        id: 'log-6',
        date: '2026-02-13',
        scheduledSleepTime: NOW - 6 * DAY_MS,
        score: 90,
        usagePenalty: 5,
        environmentPenalty: 5,

        phase1Warning: false,
        phase2Warning: false,
        lightExceeded: false,
        noiseExceeded: true,
        mood: 4,
        createdAt: NOW - 6 * DAY_MS + 8 * 60 * 60 * 1000,
    },
    // 7. 完璧な日 (7日前)
    {
        id: 'log-7',
        date: '2026-02-12',
        scheduledSleepTime: NOW - 7 * DAY_MS,
        score: 100,
        usagePenalty: 0,
        environmentPenalty: 0,

        phase1Warning: false,
        phase2Warning: false,
        lightExceeded: false,
        noiseExceeded: false,
        mood: 5,
        createdAt: NOW - 7 * DAY_MS + 8 * 60 * 60 * 1000,
    },
];
