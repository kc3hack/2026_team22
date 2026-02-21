/**
 * 日付ユーティリティ（ローカルタイムゾーン）
 *
 * toISOString().slice(0, 10) は UTC の日付を返すため、
 * 日本時間など UTC+9 では早朝に「今日」「昨日」が誤って計算される。
 * これらの関数はローカルタイムゾーンのカレンダー日を返す。
 */

/**
 * 日付をローカルタイムゾーンの YYYY-MM-DD に変換する
 */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 今日の日付をローカルタイムゾーンで YYYY-MM-DD で返す
 */
export function getTodayLocalString(): string {
  return toLocalDateString(new Date());
}

/**
 * 昨日の日付をローカルタイムゾーンで YYYY-MM-DD で返す
 */
export function getYesterdayLocalString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

/**
 * 日付文字列 (YYYY-MM-DD) に N 日を加算した日付を YYYY-MM-DD で返す
 * 就寝日 → 起床日の変換に使用
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}
