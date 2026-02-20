/**
 * 設定 API クライアント
 *
 * GET /api/v1/settings — バックエンドから設定を取得
 * PUT /api/v1/settings — バックエンドに設定を保存
 *
 * バックエンドは snake_case、フロントは camelCase なので変換を行う。
 */

import { apiV1Fetch } from '@shared/lib';
import type { SleepSettings, TodayOverride } from './types';

/* ------------------------------------------------------------------ */
/*  Backend ↔ Frontend 型変換                                          */
/* ------------------------------------------------------------------ */

/** バックエンドのレスポンス型（snake_case） */
interface SettingsApiResponse {
  wake_up_hour: number;
  wake_up_minute: number;
  sleep_duration_hours: number;
  resilience_window_minutes: number;
  mission_enabled: boolean;
  mission_target: string | null;
  preparation_minutes: number;
  ics_url: string | null;
  today_override: {
    date: string;
    sleep_hour: number;
    sleep_minute: number;
    wake_hour: number;
    wake_minute: number;
  } | null;
}

/** バックエンドのリクエスト型（snake_case） */
interface SettingsApiRequest {
  wake_up_hour: number;
  wake_up_minute: number;
  sleep_duration_hours: number;
  resilience_window_minutes: number;
  mission_enabled: boolean;
  mission_target: string | null;
  preparation_minutes: number;
  ics_url: string | null;
  today_override: {
    date: string;
    sleep_hour: number;
    sleep_minute: number;
    wake_hour: number;
    wake_minute: number;
  } | null;
}

/** snake_case レスポンス → camelCase フロント型 */
function responseToCamel(res: SettingsApiResponse): Partial<SleepSettings> {
  const todayOverride: TodayOverride | null = res.today_override
    ? {
        date: res.today_override.date,
        sleepHour: res.today_override.sleep_hour,
        sleepMinute: res.today_override.sleep_minute,
        wakeHour: res.today_override.wake_hour,
        wakeMinute: res.today_override.wake_minute,
      }
    : null;

  return {
    wakeUpHour: res.wake_up_hour,
    wakeUpMinute: res.wake_up_minute,
    sleepDurationHours: res.sleep_duration_hours,
    resilienceWindowMinutes: res.resilience_window_minutes,
    missionEnabled: res.mission_enabled,
    missionTarget: res.mission_target ?? 'washroom',
    preparationMinutes: res.preparation_minutes,
    icsUrl: res.ics_url ?? undefined,
    todayOverride,
  };
}

/** camelCase フロント型 → snake_case リクエスト */
function settingsToSnake(s: SleepSettings): SettingsApiRequest {
  const todayOverride = s.todayOverride
    ? {
        date: s.todayOverride.date,
        sleep_hour: s.todayOverride.sleepHour,
        sleep_minute: s.todayOverride.sleepMinute,
        wake_hour: s.todayOverride.wakeHour,
        wake_minute: s.todayOverride.wakeMinute,
      }
    : null;

  return {
    wake_up_hour: s.wakeUpHour,
    wake_up_minute: s.wakeUpMinute,
    sleep_duration_hours: s.sleepDurationHours,
    resilience_window_minutes: s.resilienceWindowMinutes,
    mission_enabled: s.missionEnabled,
    mission_target: s.missionTarget || null,
    preparation_minutes: s.preparationMinutes,
    ics_url: s.icsUrl ?? null,
    today_override: todayOverride,
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * GET /api/v1/settings — バックエンドから設定を取得し camelCase に変換して返す。
 * 失敗時は Error を throw する。
 */
export async function fetchSettingsFromApi(): Promise<Partial<SleepSettings>> {
  const res = await apiV1Fetch('/settings');
  if (!res.ok) {
    throw new Error(`GET /settings failed: ${res.status}`);
  }
  const data: SettingsApiResponse = await res.json();
  return responseToCamel(data);
}

/**
 * PUT /api/v1/settings — 設定をバックエンドに保存し、レスポンスを camelCase で返す。
 * 失敗時は Error を throw する。
 */
export async function saveSettingsToApi(settings: SleepSettings): Promise<Partial<SleepSettings>> {
  const body = settingsToSnake(settings);
  const res = await apiV1Fetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`PUT /settings failed: ${res.status}`);
  }
  const data: SettingsApiResponse = await res.json();
  return responseToCamel(data);
}
