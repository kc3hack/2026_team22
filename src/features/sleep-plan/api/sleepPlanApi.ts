/**
 * 睡眠プラン API クライアント
 *
 * 認証付き共通クライアント（apiV1Fetch）を使用し、Authorization ヘッダーを付与する。
 * バックエンドが応答する場合はその結果を返し、未実装・エラー時はモックでフォールバックする。
 */

import { apiV1Fetch } from '@shared/lib';
import type { SleepPlanRequest, WeeklySleepPlan, DailyPlan, CalendarEventSummary } from '../types';

/**
 * 今日から7日分の日付を生成
 */
const generateDates = (): { date: string; dayOfWeek: string; dateObj: Date }[] => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const result: { date: string; dayOfWeek: string; dateObj: Date }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    result.push({
      date: `${yyyy}-${mm}-${dd}`,
      dayOfWeek: days[d.getDay()] ?? '',
      dateObj: d,
    });
  }
  return result;
};

/**
 * イベントの時刻を HH:mm 形式にフォーマット
 */
const formatEventTime = (dateStr: string, allDay?: boolean): string => {
  if (allDay) return '終日';
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * 日付（YYYY-MM-DD）が一致するかチェック
 */
const isSameDay = (dateStr1: string, date2: Date): boolean => {
  const d1 = new Date(dateStr1);
  return (
    d1.getFullYear() === date2.getFullYear() &&
    d1.getMonth() === date2.getMonth() &&
    d1.getDate() === date2.getDate()
  );
};

/**
 * モック: サンプルの週間睡眠プランを生成
 */
const generateMockPlan = (calendarEvents: CalendarEventSummary[] = []): WeeklySleepPlan => {
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

  const dailyPlans: DailyPlan[] = dates.map((d, i) => {
    // 次の日の日付オブジェクトを取得 (プランでは「明日の予定」として表示するため)
    const nextDay = new Date(d.dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    // 次の日のイベントをフィルタリング
    const tomorrowEvents = calendarEvents.filter(event => isSameDay(event.start, nextDay));
    tomorrowEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // イベントテキストの生成 (例: "10:00-11:30 ミーティング\n13:00-14:00 ランチ")
    const eventTexts = tomorrowEvents.map(event => {
      if (event.allDay) {
        return `終日 ${event.title}`;
      }
      const startTime = formatEventTime(event.start, event.allDay);
      const endTime = formatEventTime(event.end, event.allDay);
      return `${startTime}-${endTime} ${event.title}`;
    });

    // 翌日の予定文字列
    const nextDayEventStr = eventTexts.length > 0 ? eventTexts.join('\n') : undefined;

    // もし動的なイベントが無ければ、重要度やアドバイスも合わせた方が自然だが、
    // 今回は「ICSからの予定表示」が目的なので、予定テキストのみを置き換える。
    // 重要度とアドバイスはモックのままにするか、予定の有無で簡易判定する。
    // ここでは予定がある場合はhigh/medium、無い場合はlowとする簡易ロジックを追加（任意）。
    let importance = importancePattern[i] ?? 'low';
    let advice = mockAdvices[i] ?? '';

    if (eventTexts.length > 0) {
      importance = tomorrowEvents.length > 2 ? 'high' : 'medium';
      advice = `翌日は${tomorrowEvents.length}件の予定があります。しっかり睡眠を取りましょう。`;
    } else {
      importance = 'low';
      advice = '翌日は特に大きな予定はありません。リラックスして過ごしましょう。';
    }

    return {
      date: d.date,
      dayOfWeek: d.dayOfWeek,
      recommendedSleepTime: sleepTimes[i] ?? '23:00',
      recommendedWakeTime: wakeTimes[i] ?? '07:00',
      sleepDurationHours: durations[i] ?? 8,
      importance,
      advice,
      nextDayEvent: nextDayEventStr,
    };
  });

  return {
    id: `plan-${Date.now()}`,
    dailyPlans,
    createdAt: new Date().toISOString(),
    cacheHit: false,
  };
};

/**
 * リクエスト Body をバックエンド向け snake_case に変換
 */
const toSnakeCaseBody = (req: SleepPlanRequest): Record<string, unknown> => {
  const todayOverride = req.todayOverride
    ? {
      date: req.todayOverride.date,
      sleep_hour: req.todayOverride.sleepHour,
      sleep_minute: req.todayOverride.sleepMinute,
      wake_hour: req.todayOverride.wakeHour,
      wake_minute: req.todayOverride.wakeMinute,
    }
    : null;

  return {
    calendar_events: req.calendarEvents.map(e => ({
      title: e.title,
      start: e.start,
      end: e.end,
      all_day: e.allDay ?? false,
    })),
    sleep_logs: req.sleepLogs.map(l => ({
      date: l.date,
      score: l.score,
      scheduled_sleep_time: l.scheduledSleepTime,
    })),
    settings: {
      wake_up_time: req.settings.wakeUpTime,
      sleep_duration_hours: req.settings.sleepDurationHours,
    },
    today_override: todayOverride,
  };
};

/**
 * 週間睡眠プランを取得
 *
 * 認証トークン付きで POST /api/v1/sleep-plans を呼ぶ。バックエンドが 2xx を返せばその結果を返し、
 * 未実装・エラー時はモックでフォールバックする。
 *
 * @param request リクエストデータ（カレンダー予定 + 睡眠ログ + 設定 + todayOverride）
 * @param force  true のとき ?force=true を付与しキャッシュを無視して再計算
 * @returns 週間睡眠プラン
 */
export const fetchSleepPlan = async (
  request: SleepPlanRequest,
  force = false,
): Promise<WeeklySleepPlan> => {
  const path = force ? '/sleep-plans?force=true' : '/sleep-plans';
  const body = toSnakeCaseBody(request);

  const response = await apiV1Fetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (response.ok) {
    return response.json() as Promise<WeeklySleepPlan>;
  }

  // バックエンド未実装・接続不可・401 などはモックでフォールバック
  console.warn(
    '[SleepPlanApi] Backend returned',
    response.status,
    '- using mock data. URL:',
    path,
  );
  await new Promise<void>(resolve => setTimeout(() => resolve(), 800));
  return generateMockPlan(request.calendarEvents);
};
