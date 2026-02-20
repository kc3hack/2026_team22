/**
 * 認証付き共通 API クライアント
 *
 * 自前バックエンド（FastAPI）へのリクエストに Authorization ヘッダーを付与する。
 * トークンは Supabase Auth のセッションから取得し、必要ならリフレッシュしてから付与する。
 *
 * 使用例:
 *   const res = await authenticatedFetch('/api/v1/settings');
 *   const res = await authenticatedFetch('/api/v1/sleep-plans', { method: 'POST', body: JSON.stringify(data) });
 */

import Constants from 'expo-constants';
import { supabase } from './supabase';

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

export type AuthenticatedFetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string> | Headers;
  /** true のときはトークンがなくても Authorization を付けずにリクエストする（未認証で 401 になる） */
  skipAuth?: boolean;
};

/**
 * 現在のアクセストークンを取得する。期限切れの場合はリフレッシュしてから返す。
 * Supabase 未設定または未ログインの場合は null。
 */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session) return null;
  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  const bufferSeconds = 60;
  if (expiresAt != null && expiresAt < now + bufferSeconds) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session) return null;
    return refreshed.session.access_token;
  }
  return session.access_token;
}

/**
 * 認証トークン付きで fetch する。
 * - Supabase が設定されていてセッションがあれば Authorization: Bearer <token> を付与する。
 * - トークンが期限切れの場合はリフレッシュしてから付与する。
 * - skipAuth: true のときはトークンを付けない。
 */
export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;
  const headers = new Headers(DEFAULT_HEADERS);
  if (customHeaders) {
    const h = customHeaders instanceof Headers ? customHeaders : new Headers(customHeaders);
    h.forEach((value, key) => headers.set(key, value));
  }
  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...rest, headers });
}

/**
 * バックエンド API のベース URL（末尾の /api/v1 は含めない。例: http://192.168.x.x:8000）
 */
export function getApiBaseUrl(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };
  const base = (extra.apiUrl ?? '').trim();
  return base ? base.replace(/\/$/, '') : 'http://localhost:8000';
}

/**
 * 認証付きでバックエンドの /api/v1 へのフル URL を取得して fetch する。
 * path は /api/v1 からの相対（先頭スラッシュあり: '/settings'）またはスラッシュなし（'settings'）で指定。
 */
export async function apiV1Fetch(
  path: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}/api/v1${normalizedPath}`;
  return authenticatedFetch(url, options);
}
