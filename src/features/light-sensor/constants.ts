/**
 * 照度に関する定数
 */
export const LIGHT_CONSTANTS = {
  /** 睡眠に最適な照度の上限（ルクス） */
  OPTIMAL_SLEEP_LUX: 10,
  /** 睡眠準備に適した照度の上限（ルクス） */
  PREPARE_SLEEP_LUX: 50,
  /** 通常の室内照度（ルクス） */
  NORMAL_INDOOR_LUX: 300,
  /** センサーの更新間隔（ミリ秒） */
  SENSOR_UPDATE_INTERVAL: 500,
} as const;
/**
 * バックグラウンドタスク関連の定数
 */
export const BACKGROUND_CONSTANTS = {
  /** バックグラウンドタスクの名前 */
  TASK_NAME: 'LightSensorBackgroundTask',
  /** バックグラウンドタスク実行の最小間隔（ミリ秒） */
  TASK_MIN_INTERVAL: 1000,
  /** バックグラウンドタスク実行時の最大隔間（ミリ秒） */
  TASK_MAX_INTERVAL: 5000,
  /** バックグラウンドでのセンサー更新間隔（ミリ秒） */
  BACKGROUND_SENSOR_UPDATE_INTERVAL: 2000,
  /** AsyncStorageキー：バックグラウンドタスク状態 */
  STORAGE_KEY_BG_ACTIVE: 'light_sensor_bg_active',
  /** AsyncStorageキー：最新のセンサーデータ */
  STORAGE_KEY_SENSOR_DATA: 'light_sensor_latest_data',
} as const;
