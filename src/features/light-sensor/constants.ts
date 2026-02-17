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
