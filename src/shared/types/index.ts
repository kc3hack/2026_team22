/**
 * 共通型定義
 * アプリ全体で使用する型をここに定義
 */

/**
 * API レスポンスの基本型
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * 非同期状態の型
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}
