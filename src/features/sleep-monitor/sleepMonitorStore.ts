import { create } from 'zustand';
import type {
  MonitorPhase,
  WarningLevel,
  EnvironmentData,
  UsageData,
  SleepScore,
  MonitorState,
} from './types';
import { SCORE_POINTS } from './constants';

/**
 * 睡眠監視ストアのアクション
 */
interface MonitorActions {
  /** 就寝予定時刻を設定 */
  setSleepTime: (sleepTime: number) => void;
  /** 監視を開始 */
  startMonitoring: () => void;
  /** 監視を停止 */
  stopMonitoring: () => void;
  /** フェーズを更新 */
  setPhase: (phase: MonitorPhase) => void;
  /** 環境データを更新 */
  updateEnvironment: (data: Partial<EnvironmentData>) => void;
  /** 使用時間を加算 */
  incrementUsage: () => void;
  /** 使用状況をリセット（Phase移行時） */
  resetUsage: () => void;
  /** 警告を追加 */
  addWarning: (phase: MonitorPhase, level: WarningLevel, message: string) => void;
  /** スコアを再計算 */
  recalculateScore: () => void;
  /** アプリ外フラグを設定 */
  setOutsideApp: (isOutside: boolean) => void;
  /** 全状態をリセット */
  reset: () => void;
}

/** 初期環境データ */
const initialEnvironment: EnvironmentData = {
  lightLux: null,
  noiseDb: null,
  isLightExceeded: false,
  isNoiseExceeded: false,
};

/** 初期使用状況 */
const initialUsage: UsageData = {
  usageMinutes: 0,
  isOutsideApp: false,
  lastCheckTime: 0,
};

/** 初期スコア */
const initialScore: SleepScore = {
  total: SCORE_POINTS.BASE_SCORE,
  usagePenalty: 0,
  environmentPenalty: 0,

  phase1Warning: false,
  phase2Warning: false,
  lightExceeded: false,
  noiseExceeded: false,
};

/** 初期状態 */
const initialState: MonitorState = {
  sleepTime: null,
  currentPhase: 'idle',
  isMonitoring: false,
  environment: initialEnvironment,
  usage: initialUsage,
  warnings: [],
  score: initialScore,
  monitorStartTime: null,
};

/**
 * 睡眠監視ストア
 * フェーズ管理、環境監視、スマホ使用追跡、スコアリングを一元管理
 */
export const useSleepMonitorStore = create<MonitorState & MonitorActions>((set, get) => ({
  ...initialState,

  setSleepTime: (sleepTime: number) => set({ sleepTime }),

  startMonitoring: () =>
    set({
      isMonitoring: true,
      currentPhase: 'phase1',
      monitorStartTime: Date.now(),
      usage: { ...initialUsage, lastCheckTime: Date.now() },
      warnings: [],
      score: initialScore,
    }),

  stopMonitoring: () => {
    // 停止前にスコアを最終計算
    get().recalculateScore();
    set({ isMonitoring: false, currentPhase: 'completed' });
  },

  setPhase: (phase: MonitorPhase) => set({ currentPhase: phase }),

  updateEnvironment: (data: Partial<EnvironmentData>) =>
    set(state => ({
      environment: { ...state.environment, ...data },
    })),

  incrementUsage: () =>
    set(state => ({
      usage: {
        ...state.usage,
        usageMinutes: state.usage.usageMinutes + 1,
        lastCheckTime: Date.now(),
      },
    })),

  resetUsage: () =>
    set({
      usage: { usageMinutes: 0, isOutsideApp: false, lastCheckTime: Date.now() },
    }),

  addWarning: (phase: MonitorPhase, level: WarningLevel, message: string) =>
    set(state => ({
      warnings: [...state.warnings, { phase, level, message, triggeredAt: Date.now() }],
    })),

  setOutsideApp: (isOutside: boolean) =>
    set(state => ({
      usage: { ...state.usage, isOutsideApp: isOutside },
    })),

  recalculateScore: () =>
    set(state => {
      let usagePenalty = 0;
      let environmentPenalty = 0;


      const phase1Warning = state.warnings.some(w => w.phase === 'phase1');
      const phase2Warning = state.warnings.some(w => w.phase === 'phase2');

      // スマホ操作減点
      if (phase1Warning) usagePenalty += Math.abs(SCORE_POINTS.PHASE1_PENALTY);
      if (phase2Warning) usagePenalty += Math.abs(SCORE_POINTS.PHASE2_PENALTY);

      // 環境減点
      const lightExceeded = state.environment.isLightExceeded;
      const noiseExceeded = state.environment.isNoiseExceeded;
      if (lightExceeded) environmentPenalty += Math.abs(SCORE_POINTS.LIGHT_PENALTY);
      if (noiseExceeded) environmentPenalty += Math.abs(SCORE_POINTS.NOISE_PENALTY);



      const total = Math.max(
        SCORE_POINTS.MIN_SCORE,
        Math.min(
          SCORE_POINTS.MAX_SCORE,
          SCORE_POINTS.BASE_SCORE - usagePenalty - environmentPenalty
        )
      );

      return {
        score: {
          total,
          usagePenalty,
          environmentPenalty,

          phase1Warning,
          phase2Warning,
          lightExceeded,
          noiseExceeded,
        },
      };
    }),

  reset: () => set(initialState),
}));
