import { useState, useEffect, useCallback, useRef } from 'react';
import { useSleepMonitorStore } from '../sleepMonitorStore';
import { useUsageTracker } from './useUsageTracker';
import { useNoiseSensor } from './useNoiseSensor';
import { useLightSensor } from '@features/light-sensor';
import { geminiClient } from '@shared/lib/gemini';
import { googleCalendar } from '@shared/lib/googleCalendar';
import {
  initializeNotifications,
  sendLocalNotification,
  canSendNotification,
  resetNotificationCooldowns,
} from '@shared/lib/notifications';
import {
  PHASE_DURATION,
  USAGE_THRESHOLDS,
  ENVIRONMENT_THRESHOLDS,
  POLLING_INTERVAL,
  NOTIFICATION_CONFIG,
} from '../constants';
import type { MonitorPhase, EventImportance } from '../types';

interface UseSleepMonitorReturn {
  /** 現在のフェーズ */
  currentPhase: MonitorPhase;
  /** 監視中かどうか */
  isMonitoring: boolean;
  /** 就寝予定時刻 */
  sleepTime: number | null;
  /** フェーズ内の残り時間（秒） */
  remainingSeconds: number;
  /** 全体の残り時間（秒） */
  totalRemainingSeconds: number;
  /** スマホ操作時間（分） */
  usageMinutes: number;
  /** 光（lux） */
  lightLux: number | null;
  /** 音（dB） */
  noiseDb: number | null;
  /** 光がNGか */
  isLightExceeded: boolean;
  /** 音がNGか */
  isNoiseExceeded: boolean;
  /** 現在のスコア */
  score: number;
  /** 最新の警告メッセージ */
  latestWarning: string | null;
  /** 警告を表示中か */
  showWarning: boolean;
  /** 監視を開始 */
  startMonitoring: (sleepTime: number) => void;
  /** 監視を停止 */
  stopMonitoring: () => void;
  /** 警告を閉じる */
  dismissWarning: () => void;
}

/**
 * カレンダーの予定から重要度を判定する
 * TODO: Step 3で実際のカレンダー予定のタイトルを解析して重要度を判定
 */
const determineImportance = (_events: { title: string }[]): EventImportance => {
  // TODO: 「テスト」「面接」などのキーワードで判定
  return 'low';
};

/**
 * 睡眠監視のコアフック
 *
 * フェーズ判定、センサー統合、使用時間追跡、警告発動を統合管理する。
 */
export const useSleepMonitor = (): UseSleepMonitorReturn => {
  const store = useSleepMonitorStore();
  const usageTracker = useUsageTracker();
  const noiseSensor = useNoiseSensor();
  const lightSensor = useLightSensor();

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalRemainingSeconds, setTotalRemainingSeconds] = useState(0);
  const [latestWarning, setLatestWarning] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const phaseUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggeredPhase1Ref = useRef(false);
  const hasTriggeredPhase2Ref = useRef(false);

  /**
   * フェーズを計算
   */
  const calculatePhase = useCallback((sleepTime: number): MonitorPhase => {
    const now = Date.now();
    const minutesUntilSleep = (sleepTime - now) / (60 * 1000);

    if (minutesUntilSleep <= 0) return 'completed';
    if (minutesUntilSleep <= PHASE_DURATION.PHASE3) return 'phase3';
    if (minutesUntilSleep <= PHASE_DURATION.PHASE3 + PHASE_DURATION.PHASE2) return 'phase2';
    if (minutesUntilSleep <= PHASE_DURATION.TOTAL) return 'phase1';
    return 'idle';
  }, []);

  /**
   * フェーズ内の残り時間を計算（秒）
   */
  const calculateRemainingSeconds = useCallback(
    (sleepTime: number, phase: MonitorPhase): number => {
      const now = Date.now();
      const msUntilSleep = sleepTime - now;

      switch (phase) {
        case 'phase1': {
          // Phase1の終了 = T-30分
          const phase1End = sleepTime - (PHASE_DURATION.PHASE3 + PHASE_DURATION.PHASE2) * 60 * 1000;
          return Math.max(0, Math.floor((phase1End - now) / 1000));
        }
        case 'phase2': {
          // Phase2の終了 = T-10分
          const phase2End = sleepTime - PHASE_DURATION.PHASE3 * 60 * 1000;
          return Math.max(0, Math.floor((phase2End - now) / 1000));
        }
        case 'phase3':
          return Math.max(0, Math.floor(msUntilSleep / 1000));
        default:
          return 0;
      }
    },
    []
  );

  /**
   * 監視を開始
   */
  const startMonitoring = useCallback(
    (sleepTime: number) => {
      store.setSleepTime(sleepTime);
      store.startMonitoring();
      usageTracker.startTracking();
      hasTriggeredPhase1Ref.current = false;
      hasTriggeredPhase2Ref.current = false;

      // プッシュ通知を初期化
      initializeNotifications();
      resetNotificationCooldowns();

      // 光センサーを開始
      if (lightSensor.isAvailable && !lightSensor.isActive) {
        lightSensor.startSensor();
      }

      // 音センサーを開始
      if (noiseSensor.isAvailable && !noiseSensor.isActive) {
        noiseSensor.startSensor();
      }
    },
    [store, usageTracker, lightSensor, noiseSensor]
  );

  /**
   * 監視を停止
   */
  const stopMonitoring = useCallback(() => {
    store.stopMonitoring();
    usageTracker.stopTracking();
    noiseSensor.stopSensor();
    resetNotificationCooldowns();

    if (phaseUpdateRef.current) {
      clearInterval(phaseUpdateRef.current);
      phaseUpdateRef.current = null;
    }
  }, [store, usageTracker, noiseSensor]);

  /**
   * 警告を閉じる
   */
  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  // フェーズ更新ループ
  useEffect(() => {
    if (!store.isMonitoring || !store.sleepTime) return;

    const updatePhase = () => {
      if (!store.sleepTime) return;

      const newPhase = calculatePhase(store.sleepTime);
      const prevPhase = store.currentPhase;

      // フェーズが変わった場合
      if (newPhase !== prevPhase) {
        store.setPhase(newPhase);

        // Phase1 → Phase2遷移時：使用時間を保存してリセット
        if (prevPhase === 'phase1' && newPhase === 'phase2') {
          usageTracker.resetCounter();
        }

        // 完了時に監視を停止
        if (newPhase === 'completed') {
          stopMonitoring();
        }
      }

      // 残り時間を更新
      setRemainingSeconds(calculateRemainingSeconds(store.sleepTime, newPhase));
      setTotalRemainingSeconds(Math.max(0, Math.floor((store.sleepTime - Date.now()) / 1000)));
    };

    updatePhase();
    phaseUpdateRef.current = setInterval(updatePhase, POLLING_INTERVAL.PHASE_UPDATE_MS);

    return () => {
      if (phaseUpdateRef.current) {
        clearInterval(phaseUpdateRef.current);
        phaseUpdateRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store を依存に含めると不要な再実行が増えるため除外
  }, [
    store.isMonitoring,
    store.sleepTime,
    store.currentPhase,
    calculatePhase,
    calculateRemainingSeconds,
    stopMonitoring,
    usageTracker,
  ]);

  // 環境データの同期
  useEffect(() => {
    if (!store.isMonitoring) return;

    const lightLux = lightSensor.data?.illuminance ?? null;
    const noiseDb = noiseSensor.noiseDb;

    store.updateEnvironment({
      lightLux,
      noiseDb,
      isLightExceeded: lightLux !== null && lightLux >= ENVIRONMENT_THRESHOLDS.LIGHT_MAX_LUX,
      isNoiseExceeded: noiseDb !== null && noiseDb >= ENVIRONMENT_THRESHOLDS.NOISE_MAX_DB,
    });

    // 全フェーズの環境チェック: NGラインを超えていれば通知
    if (lightLux !== null && lightLux >= ENVIRONMENT_THRESHOLDS.LIGHT_MAX_LUX) {
      // プッシュ通知（クールダウン付き）
      if (canSendNotification('light', NOTIFICATION_CONFIG.COOLDOWN_MS)) {
        sendLocalNotification(
          '💡 環境警告：光',
          `現在 ${Math.round(lightLux)} lux です。基準値（${ENVIRONMENT_THRESHOLDS.LIGHT_MAX_LUX} lux）を超えています。照明を暗くしましょう。`
        );
      }
      // Phase 3ではアプリ内警告も表示
      if (store.currentPhase === 'phase3') {
        geminiClient.generateEnvironmentAdvice(lightLux, noiseDb).then(msg => {
          setLatestWarning(msg);
          setShowWarning(true);
        });
      }
    }
    if (noiseDb !== null && noiseDb >= ENVIRONMENT_THRESHOLDS.NOISE_MAX_DB) {
      // プッシュ通知（クールダウン付き）
      if (canSendNotification('noise', NOTIFICATION_CONFIG.COOLDOWN_MS)) {
        sendLocalNotification(
          '🔊 環境警告：音',
          `現在 ${Math.round(noiseDb)} dB です。基準値（${ENVIRONMENT_THRESHOLDS.NOISE_MAX_DB} dB）を超えています。静かな環境を整えましょう。`
        );
      }
      // Phase 3ではアプリ内警告も表示
      if (store.currentPhase === 'phase3') {
        geminiClient.generateEnvironmentAdvice(lightLux, noiseDb).then(msg => {
          setLatestWarning(msg);
          setShowWarning(true);
        });
      }
    }

    store.recalculateScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store を依存に含めると不要な再実行が増えるため除外
  }, [lightSensor.data?.illuminance, noiseSensor.noiseDb, store.isMonitoring, store.currentPhase]);

  // 使用時間の警告チェック
  useEffect(() => {
    if (!store.isMonitoring) return;

    const currentUsage = usageTracker.usageMinutes;

    // Phase 1 警告: 20分以上
    if (
      store.currentPhase === 'phase1' &&
      currentUsage >= USAGE_THRESHOLDS.PHASE1_WARN &&
      !hasTriggeredPhase1Ref.current
    ) {
      hasTriggeredPhase1Ref.current = true;

      // 明日の予定を取得して重要度判定
      googleCalendar.getEvents().then(events => {
        const importance = determineImportance(events);
        const tomorrowEvents = events.map(e => e.title);
        geminiClient
          .generateWarning({
            phase: 'phase1',
            importance,
            usageMinutes: currentUsage,
            tomorrowEvents,
          })
          .then(message => {
            const warningLevel = importance === 'high' ? 'strict' : 'normal';
            store.addWarning('phase1', warningLevel, message);
            setLatestWarning(message);
            setShowWarning(true);
            store.recalculateScore();
            // プッシュ通知
            sendLocalNotification('📱 スマホ使用警告', message);
          });
      });
    }

    // Phase 2 警告: 15分以上
    if (
      store.currentPhase === 'phase2' &&
      currentUsage >= USAGE_THRESHOLDS.PHASE2_WARN &&
      !hasTriggeredPhase2Ref.current
    ) {
      hasTriggeredPhase2Ref.current = true;

      googleCalendar.getEvents().then(events => {
        const importance = determineImportance(events);
        const tomorrowEvents = events.map(e => e.title);
        geminiClient
          .generateWarning({
            phase: 'phase2',
            importance,
            usageMinutes: currentUsage,
            tomorrowEvents,
          })
          .then(message => {
            store.addWarning('phase2', 'strict', message);
            setLatestWarning(message);
            setShowWarning(true);
            store.recalculateScore();
            // プッシュ通知
            sendLocalNotification('⚠️ スマホ使用警告', message);
          });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store を依存に含めると不要な再実行が増えるため除外
  }, [usageTracker.usageMinutes, store.currentPhase, store.isMonitoring]);

  return {
    currentPhase: store.currentPhase,
    isMonitoring: store.isMonitoring,
    sleepTime: store.sleepTime,
    remainingSeconds,
    totalRemainingSeconds,
    usageMinutes: usageTracker.usageMinutes,
    lightLux: store.environment.lightLux,
    noiseDb: store.environment.noiseDb,
    isLightExceeded: store.environment.isLightExceeded,
    isNoiseExceeded: store.environment.isNoiseExceeded,
    score: store.score.total,
    latestWarning,
    showWarning,
    startMonitoring,
    stopMonitoring,
    dismissWarning,
  };
};
