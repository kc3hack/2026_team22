/**
 * 睡眠ログ API クライアント
 *
 * GET    /api/v1/sleep-logs        — ログ一覧取得
 * POST   /api/v1/sleep-logs        — ログ新規作成
 * PATCH  /api/v1/sleep-logs/:id    — 気分（mood）更新
 *
 * バックエンドは snake_case、フロントは camelCase なので変換を行う。
 */

import { apiV1Fetch } from '@shared/lib';
import type { SleepLogEntry } from './types';

/* ------------------------------------------------------------------ */
/*  Backend ↔ Frontend 型変換                                          */
/* ------------------------------------------------------------------ */

/** バックエンドのレスポンス型（snake_case） */
interface SleepLogApiResponse {
  id: string;
  user_id: string;
  date: string; // "YYYY-MM-DD"
  score: number;
  scheduled_sleep_time: string | null; // ISO datetime
  usage_penalty: number;
  environment_penalty: number;
  phase1_warning: boolean;
  phase2_warning: boolean;
  light_exceeded: boolean;
  noise_exceeded: boolean;
  mood: number | null;
  created_at: string; // ISO datetime
}

/** バックエンドのリスト取得レスポンス */
interface SleepLogListApiResponse {
  logs: SleepLogApiResponse[];
  total: number;
}

/** POST リクエスト Body（snake_case） */
interface SleepLogCreateRequest {
  date: string;
  score: number;
  scheduled_sleep_time: string | null;
  usage_penalty: number;
  environment_penalty: number;
  phase1_warning: boolean;
  phase2_warning: boolean;
  light_exceeded: boolean;
  noise_exceeded: boolean;
  mood: number | null;
}

/** PATCH リクエスト Body（snake_case） */
interface SleepLogMoodUpdateRequest {
  mood: number;
}

/** snake_case レスポンス → camelCase フロント型 */
function responseToCamel(res: SleepLogApiResponse): SleepLogEntry {
  return {
    id: res.id,
    date: res.date,
    score: res.score,
    scheduledSleepTime: res.scheduled_sleep_time
      ? new Date(res.scheduled_sleep_time).getTime()
      : 0,
    usagePenalty: res.usage_penalty,
    environmentPenalty: res.environment_penalty,
    phase1Warning: res.phase1_warning,
    phase2Warning: res.phase2_warning,
    lightExceeded: res.light_exceeded,
    noiseExceeded: res.noise_exceeded,
    mood: res.mood,
    createdAt: new Date(res.created_at).getTime(),
  };
}

/** camelCase フロント型 → snake_case POST リクエスト */
function entryToSnake(
  entry: Omit<SleepLogEntry, 'id' | 'createdAt' | 'mood'>
): SleepLogCreateRequest {
  return {
    date: entry.date,
    score: entry.score,
    scheduled_sleep_time: entry.scheduledSleepTime
      ? new Date(entry.scheduledSleepTime).toISOString()
      : null,
    usage_penalty: entry.usagePenalty,
    environment_penalty: entry.environmentPenalty,
    phase1_warning: entry.phase1Warning,
    phase2_warning: entry.phase2Warning,
    light_exceeded: entry.lightExceeded,
    noise_exceeded: entry.noiseExceeded,
    mood: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * GET /api/v1/sleep-logs — 睡眠ログ一覧を取得する（日付降順）。
 */
export async function fetchSleepLogsFromApi(
  limit = 7
): Promise<SleepLogEntry[]> {
  const res = await apiV1Fetch(`/sleep-logs?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`GET /sleep-logs failed: ${res.status}`);
  }
  const data: SleepLogListApiResponse = await res.json();
  return data.logs.map(responseToCamel);
}

/**
 * POST /api/v1/sleep-logs — 睡眠ログを新規作成する。
 */
export async function createSleepLogViaApi(
  entry: Omit<SleepLogEntry, 'id' | 'createdAt' | 'mood'>
): Promise<SleepLogEntry> {
  const body = entryToSnake(entry);
  const res = await apiV1Fetch('/sleep-logs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST /sleep-logs failed: ${res.status}`);
  }
  const data: SleepLogApiResponse = await res.json();
  return responseToCamel(data);
}

/**
 * PATCH /api/v1/sleep-logs/:id — 睡眠ログの気分を更新する（朝の振り返り用）。
 */
export async function updateSleepLogMoodViaApi(
  logId: string,
  mood: number
): Promise<SleepLogEntry> {
  const body: SleepLogMoodUpdateRequest = { mood };
  const res = await apiV1Fetch(`/sleep-logs/${logId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`PATCH /sleep-logs/${logId} failed: ${res.status}`);
  }
  const data: SleepLogApiResponse = await res.json();
  return responseToCamel(data);
}
