/**
 * Supabase クライアント（認証・セッション永続化）
 *
 * セッションは AsyncStorage に保存し、アプリ再起動後も維持する。
 * トークンは Supabase Auth から取得し、自前 API の Authorization ヘッダーに付与する。
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};
const supabaseUrl = (extra.supabaseUrl ?? '').trim();
const supabaseAnonKey = (extra.supabaseAnonKey ?? '').trim();

if (__DEV__ && (supabaseUrl || supabaseAnonKey)) {
  console.warn('[supabase] using url:', supabaseUrl || '(missing)');
}
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Auth will not work until .env.expo.local is set (e.g. task dev-up).'
  );
}

let _client: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase: SupabaseClient | null = _client;

/** Supabase が有効に設定されているか */
export const isSupabaseConfigured = (): boolean => supabase !== null;
