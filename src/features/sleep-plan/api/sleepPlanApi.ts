/**
 * 睡眠プラン API クライアント
 *
 * バックエンド完成後に実装を差し替えるだけで動く設計。
 * 現状はスタブ（モックデータ）を返す。
 */

import Constants from 'expo-constants';
import type { SleepPlanRequest, WeeklySleepPlan, DailyPlan } from '../types';

/** バックエンドAPIのベースURL（.env.expo.local の EXPO_PUBLIC_API_URL → app.config.js extra.apiUrl） */
const base = (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.trim();
const API_BASE_URL = base
  ? `${base.replace(/\/$/, '')}/api/v1`
  : 'http://localhost:8000/api/v1';

/**
 * 今日から7日分の日付を生成
 */
const generateDates = (): { date: string; dayOfWeek: string }[] => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const result: { date: string; dayOfWeek: string }[] = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        result.push({
            date: `${yyyy}-${mm}-${dd}`,
            dayOfWeek: days[d.getDay()] ?? '',
        });
    }
    return result;
};

/**
 * モック: サンプルの週間睡眠プランを生成
 */
const generateMockPlan = (): WeeklySleepPlan => {
    const dates = generateDates();

    const mockAdvices = [
        '明日は大事な会議があります。いつもより30分早く就寝しましょう。',
        '予定が少ない日です。リラックスして自然な眠気を待ちましょう。',
        '午後にプレゼンがあります。十分な睡眠で集中力を高めましょう。',
        '休日前夜です。少し遅めでも大丈夫ですが、リズムを崩しすぎないように。',
        '運動の予定があります。深い睡眠のために早めの就寝をおすすめします。',
        '特に重要な予定はありません。規則正しい時間に就寝しましょう。',
        '週明けに備えて、しっかり休息を取りましょう。',
    ];

    const mockEvents = [
        'チームミーティング',
        undefined,
        '企画プレゼン',
        undefined,
        'ジム（トレーニング）',
        undefined,
        '週次レビュー',
    ];

    const importancePattern: DailyPlan['importance'][] = [
        'high',
        'low',
        'high',
        'low',
        'medium',
        'low',
        'medium',
    ];

    const sleepTimes = ['23:00', '23:30', '22:30', '23:30', '23:00', '00:00', '23:00'];
    const wakeTimes = ['07:00', '07:00', '06:30', '07:30', '07:00', '08:00', '07:00'];
    const durations = [8, 7.5, 8, 8, 8, 8, 8];

    const dailyPlans: DailyPlan[] = dates.map((d, i) => ({
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        recommendedSleepTime: sleepTimes[i] ?? '23:00',
        recommendedWakeTime: wakeTimes[i] ?? '07:00',
        sleepDurationHours: durations[i] ?? 8,
        importance: importancePattern[i] ?? 'low',
        advice: mockAdvices[i] ?? '',
        nextDayEvent: mockEvents[i],
    }));

    return {
        id: `plan-${Date.now()}`,
        dailyPlans,
        createdAt: new Date().toISOString(),
        cacheHit: false,
    };
};

/**
 * 週間睡眠プランを取得
 *
 * TODO: バックエンド完成後に実際の API 呼び出しに置き換え
 *
 * @param _request リクエストデータ（カレンダー予定 + 睡眠ログ + 設定）
 * @returns 週間睡眠プラン
 */
export const fetchSleepPlan = async (_request: SleepPlanRequest): Promise<WeeklySleepPlan> => {
    // TODO: 実際のAPI呼び出し
    // const response = await fetch(`${API_BASE_URL}/sleep-plans`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request),
    // });
    // if (!response.ok) throw new Error(`API Error: ${response.status}`);
    // return response.json();

    console.warn('[SleepPlanApi] Using mock data. API_BASE_URL:', API_BASE_URL);

    // ネットワーク遅延をシミュレート
    await new Promise<void>(resolve => setTimeout(() => resolve(), 800));

    return generateMockPlan();
};
