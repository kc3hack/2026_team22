/**
 * アプリのテーマカラー
 */
export const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  background: {
    dark: '#0F172A',
    light: '#F8FAFC',
  },
  text: {
    dark: '#F8FAFC',
    light: '#0F172A',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

/**
 * アプリ全体で使用する定数
 */
export const APP_CONFIG = {
  /** アプリ名 */
  APP_NAME: 'SleepSupportApp',
  /** APIタイムアウト（ミリ秒） */
  API_TIMEOUT: 30000,
} as const;
