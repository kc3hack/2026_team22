/**
 * 睡眠プラン API クライアント
 *
 * 認証付き共通クライアント（apiV1Fetch）を使用し、Authorization ヘッダーを付与する。
 * バックエンドが 2xx を返した場合のみプランを返し、それ以外は取得エラーとして throw する。
 */

import { apiV1Fetch } from '@shared/lib';
import type { SleepPlanRequest, WeeklySleepPlan, DailyPlan } from '../types';

/** バックエンドが返すプラン形式（week_plan + cache_hit） */
interface PlanApiDayRaw {
  date?: string;
  day?: string;
  recommended_bedtime?: string;
  recommended_wakeup?: string;
  bed_time?: string;
  wake_up?: string;
  importance?: 'high' | 'medium' | 'low';
  next_day_event?: string | null;
  advice?: string;
}

interface PlanApiResponse {
  week_plan: PlanApiDayRaw[];
  cache_hit?: boolean;
}

/**
 * 今日から7日分の日付を生成（API レスポンス変換用）
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

/** importance を正規化 */
const normalizeImportance = (
  v: string | undefined
): 'high' | 'medium' | 'low' => {
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  return 'medium';
};

/**
 * バックエンドの week_plan 形式をフロントの WeeklySleepPlan に変換
 * - 各要素に date があれば日付ベースでマッピング
 * - date がなければ従来通りインデックスベースでフォールバック
 */
const planApiResponseToWeeklyPlan = (data: PlanApiResponse): WeeklySleepPlan => {
  const dates = generateDates();
  const weekPlan = data.week_plan ?? [];
  const byDate = new Map<string, PlanApiDayRaw>();
  weekPlan.forEach(raw => {
    const date = raw?.date;
    if (date) byDate.set(date, raw);
  });

  const dailyPlans: DailyPlan[] = dates.map((d, i) => {
    const raw = byDate.get(d.date) ?? weekPlan[i];
    const recommendedSleepTime =
      raw?.recommended_bedtime ?? raw?.bed_time ?? '23:00';
    const recommendedWakeTime =
      raw?.recommended_wakeup ?? raw?.wake_up ?? '07:00';
    const importance = normalizeImportance(raw?.importance);
    const nextDayEvent = raw?.next_day_event ?? undefined;
    return {
      date: d.date,
      dayOfWeek: raw?.day ?? d.dayOfWeek,
      recommendedSleepTime,
      recommendedWakeTime,
      sleepDurationHours: 8,
      importance,
      advice: raw?.advice ?? '',
      nextDayEvent: nextDayEvent ?? undefined,
    };
  });
  return {
    id: `plan-${Date.now()}`,
    dailyPlans,
    createdAt: new Date().toISOString(),
    cacheHit: data.cache_hit ?? false,
  };
};

/**
 * リクエスト Body をバックエンド向けに変換
 * 注意: today_override はバックエンドが camelCase で受け付けるため、そのまま渡す
 */
const toSnakeCaseBody = (req: SleepPlanRequest): Record<string, unknown> => {
  const todayOverride = req.todayOverride
    ? {
        date: req.todayOverride.date,
        sleepHour: req.todayOverride.sleepHour,
        sleepMinute: req.todayOverride.sleepMinute,
        wakeHour: req.todayOverride.wakeHour,
        wakeMinute: req.todayOverride.wakeMinute,
      }
    : null;

  const body: Record<string, unknown> = {
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
      mood: l.mood ?? null,
    })),
    settings: {
      wake_up_time: req.settings.wakeUpTime,
      sleep_duration_hours: req.settings.sleepDurationHours,
    },
    today_override: todayOverride,
  };
  if (req.todayDate) {
    body.today_date = req.todayDate;
  }
  return body;
};

/**
 * 週間睡眠プランを取得
 *
 * 認証トークン付きで POST /api/v1/sleep-plans を呼ぶ。
 * 2xx の場合のみプランを返し、それ以外は取得エラーとして throw する。
 *
 * @param request リクエストデータ（カレンダー予定 + 睡眠ログ + 設定 + todayOverride）
 * @param force  true のとき ?force=true を付与しキャッシュを無視して再計算
 * @returns 週間睡眠プラン
 * @throws バックエンドが 2xx 以外、またはネットワークエラー時に取得エラー
 */
export const fetchSleepPlan = async (
  request: SleepPlanRequest,
  force = false
): Promise<WeeklySleepPlan> => {
  const path = force ? '/sleep-plans?force=true' : '/sleep-plans';
  const body = toSnakeCaseBody(request);

  const response = await apiV1Fetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (response.ok) {
    const data = (await response.json()) as PlanApiResponse;
    return planApiResponseToWeeklyPlan(data);
  }

  let message = `プランの取得に失敗しました（${response.status}）`;
  try {
    const json = await response.json();
    if (typeof json?.detail === 'string') message = json.detail;
    else if (typeof json?.message === 'string') message = json.message;
  } catch {
    // レスポンスが JSON でない場合は上記のメッセージのまま
  }
  throw new Error(message);
};
