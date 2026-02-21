/**
 * 睡眠監視機能の定数
 */

/** フェーズ時間設定（分） */
export const PHASE_DURATION = {
  /** Phase 1: 最初の30分 (T-60 ~ T-30) */
  PHASE1: 30,
  /** Phase 2: 次の20分 (T-30 ~ T-10) */
  PHASE2: 20,
  /** Phase 3: ラスト10分 (T-10 ~ T) */
  PHASE3: 10,
  /** 監視開始: 就寝60分前 */
  TOTAL: 60,
} as const;

/** スマホ操作の警告閾値（分） */
export const USAGE_THRESHOLDS = {
  /** Phase 1: 20分以上で警告 */
  PHASE1_WARN: 1,
  /** Phase 2: 15分以上で警告 */
  PHASE2_WARN: 15,
} as const;

/** 環境NGライン */
export const ENVIRONMENT_THRESHOLDS = {
  /** 光: 30 lux以上でNG */
  LIGHT_MAX_LUX: 30,
  /** 音: 45 dB以上でNG */
  NOISE_MAX_DB: 45,
} as const;

/** スコア減点・加点 */
export const SCORE_POINTS = {
  /** 基本点 */
  BASE_SCORE: 100,
  /** Phase 1 警告発動: -20点 */
  PHASE1_PENALTY: -20,
  /** Phase 2 警告発動: -40点 */
  PHASE2_PENALTY: -40,
  /** 就寝時に明るい: -10点 */
  LIGHT_PENALTY: -10,
  /** 就寝時にうるさい: -10点 */
  NOISE_PENALTY: -10,

  /** 最高スコア */
  MAX_SCORE: 100,
  /** 最低スコア */
  MIN_SCORE: 0,
} as const;

/** ポーリング間隔 */
export const POLLING_INTERVAL = {
  /** 使用状況チェック間隔（ミリ秒）= 1分 */
  USAGE_CHECK_MS: 60 * 1000,
  /** フェーズ更新間隔（ミリ秒）= 10秒 */
  PHASE_UPDATE_MS: 10 * 1000,
  /** 環境センサー更新間隔（ミリ秒）= 5秒 */
  SENSOR_UPDATE_MS: 5 * 1000,
} as const;

/** 音圧測定の設定 */
export const NOISE_CONFIG = {
  /** サンプリング間隔（ミリ秒） */
  SAMPLE_INTERVAL_MS: 3000,
} as const;

/** 通知設定 */
export const NOTIFICATION_CONFIG = {
  /** 通知クールダウン（ミリ秒）= 1分 */
  COOLDOWN_MS: 30 * 1000,
} as const;
