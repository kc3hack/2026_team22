import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { LightSensor } from 'expo-sensors';
import BackgroundActions, { type TaskOptions } from 'react-native-background-actions';
import { LIGHT_CONSTANTS, BACKGROUND_CONSTANTS } from '../constants';
import { useLightSensorStore } from '../LightSensorStore';
import type { LightSensorData, SleepEnvironment } from '../types';
import { usePendingLastNightStore } from '@features/sleep-log/pendingLastNightStore';
import { useSleepSettingsStore } from '@features/sleep-settings';
import { getYesterdayLocalString } from '@shared/lib';

let isBackgroundRunning = false;

/** バックグラウンドタスク中に蓄積した照度（モジュール共有） */
let nightReadings: number[] = [];

interface UseLightSensorReturn {
  /** センサーデータ */
  data: LightSensorData | null;
  /** センサーが利用可能かどうか */
  isAvailable: boolean;
  /** センサーが動作中かどうか */
  isActive: boolean;
  /** バックグラウンドタスクが実行中かどうか */
  isBackgroundActive: boolean;
  /** 睡眠環境の評価 */
  sleepEnvironment: SleepEnvironment | null;
  /** センサーを開始 */
  startSensor: () => void;
  /** センサーを停止 */
  stopSensor: () => void;
  /** バックグラウンドタスクを開始 */
  startBackgroundTask: () => Promise<void>;
  /** バックグラウンドタスクを停止 */
  stopBackgroundTask: () => Promise<void>;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * 照度から睡眠環境を評価する
 */
const evaluateSleepEnvironment = (lux: number): SleepEnvironment => {
  let isSuitableForSleep = false;
  let recommendation = '';
  let score = 0;

  if (lux <= LIGHT_CONSTANTS.OPTIMAL_SLEEP_LUX) {
    isSuitableForSleep = true;
    recommendation = '完璧な睡眠環境です。おやすみなさい！';
    score = 100;
  } else if (lux <= LIGHT_CONSTANTS.PREPARE_SLEEP_LUX) {
    isSuitableForSleep = false;
    recommendation = '睡眠の準備に適した明るさです。もう少し暗くするとより良いでしょう。';
    score = 70;
  } else if (lux <= LIGHT_CONSTANTS.NORMAL_INDOOR_LUX) {
    isSuitableForSleep = false;
    recommendation = '通常の室内の明るさです。睡眠前は照明を落としましょう。';
    score = 40;
  } else {
    isSuitableForSleep = false;
    recommendation = '明るすぎます。睡眠の質を高めるために、照明を暗くしてください。';
    score = 10;
  }

  return {
    currentLux: lux,
    isSuitableForSleep,
    recommendation,
    score,
  };
};

// 上部にスリープ関数を追加
const sleep = (time: number) => new Promise<void>(resolve => setTimeout(resolve, time));

const BACKGROUND_DELAY_MS = 1000;

const backgroundSensorTask = async (_options: TaskOptions): Promise<void> => {
  const delay = BACKGROUND_DELAY_MS;
  nightReadings = [];

  try {
    LightSensor.setUpdateInterval(BACKGROUND_CONSTANTS.BACKGROUND_SENSOR_UPDATE_INTERVAL);
    const subscription = LightSensor.addListener(sensorData => {
      nightReadings.push(sensorData.illuminance);
    });
    let count = 0;
    while (isBackgroundRunning) {
      await sleep(delay);
      count++;
    }

    subscription.remove();
  } catch (error) {
    console.error('[Background] Error in light sensor task:', error);
  }
};

/**
 * 蓄積した照度からスコアを算出（平均照度を環境スコアに変換）
 */
function aggregateReadingsToScore(readings: number[]): { score: number; lightExceeded: boolean } {
  if (readings.length === 0) {
    return { score: 70, lightExceeded: false };
  }
  const avgLux = readings.reduce((a, b) => a + b, 0) / readings.length;
  const env = evaluateSleepEnvironment(avgLux);
  const lightExceeded = avgLux > LIGHT_CONSTANTS.OPTIMAL_SLEEP_LUX;
  return { score: env.score, lightExceeded };
}

/**
 * モニター停止時に仮データを pendingLastNightStore にセットする
 */
function savePendingFromMonitorReadings(): void {
  const { score, lightExceeded } = aggregateReadingsToScore(nightReadings);
  nightReadings = []; // クリア

  const yesterdayStr = getYesterdayLocalString();
  const d = new Date(yesterdayStr);

  const settings = useSleepSettingsStore.getState();
  const { hour, minute } = settings.getEffectiveSleepTime();
  const scheduledDate = new Date(d);
  scheduledDate.setHours(hour, minute, 0, 0);
  const scheduledSleepTime = scheduledDate.getTime();

  usePendingLastNightStore.getState().setPending({
    date: yesterdayStr,
    score,
    scheduledSleepTime,
    usagePenalty: 0,
    usageMinutes: 0,
    environmentPenalty: lightExceeded ? 5 : 0,
    phase1Warning: false,
    phase2Warning: false,
    lightExceeded,
    noiseExceeded: false,
  });
}

/**
 * 照度センサーを使用するカスタムフック
 */
export const useLightSensor = (): UseLightSensorReturn => {
  const [data, setData] = useState<LightSensorData | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sleepEnvironment, setSleepEnvironment] = useState<SleepEnvironment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isBackgroundTaskActive, startBackgroundTask, stopBackgroundTask, setStopCallback } =
    useLightSensorStore();

  const subscriptionRef = useRef<ReturnType<typeof LightSensor.addListener> | null>(null);

  // センサーの利用可能性をチェック
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const available = await LightSensor.isAvailableAsync();
        setIsAvailable(available);
        if (!available) {
          setError('このデバイスでは照度センサーを利用できません');
        }
      } catch {
        setError('センサーの確認中にエラーが発生しました');
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  const startSensor = useCallback(() => {
    if (!isAvailable) {
      setError('照度センサーが利用できません');
      return;
    }

    setError(null);
    LightSensor.setUpdateInterval(LIGHT_CONSTANTS.SENSOR_UPDATE_INTERVAL);

    subscriptionRef.current = LightSensor.addListener(sensorData => {
      // [実験用] フォアグラウンド時のセンサー値をログ出力（後ほど削除）
      console.warn('[Foreground] illuminance:', sensorData.illuminance, 'lux');
      setData({ illuminance: sensorData.illuminance });
      setSleepEnvironment(evaluateSleepEnvironment(sensorData.illuminance));
    });

    setIsActive(true);
  }, [isAvailable]);

  const stopSensor = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    LightSensor.removeAllListeners();
    setIsActive(false);
  }, []);

  /**
   * バックグラウンドタスクを開始
   * 画面オフ状態でもセンサーを読み続ける
   */
  const startBackgroundTaskWithSensor = useCallback(async () => {
    if (!isAvailable) {
      setError('照度センサーが利用できません');
      return;
    }

    try {
      // Androidのみでバックグラウンドタスク実行
      if (Platform.OS === 'android') {
        isBackgroundRunning = true;
        await BackgroundActions.start(backgroundSensorTask, {
          taskName: BACKGROUND_CONSTANTS.TASK_NAME,
          taskTitle: 'Light Sensor Monitoring',
          taskDesc: 'Monitoring ambient light for sleep support',
          taskIcon: {
            name: 'ic_launcher',
            type: 'mipmap',
          },
          linkingURI: 'sleepsupportapp://',
          progressBar: {
            max: 100,
            value: 50,
            indeterminate: true,
          },
          notificationChannel: {
            channelId: 'light_sensor_channel',
            channelName: 'Light Sensor Channel',
            notificationId: 42,
            importance: 4,
          },
        });

        // ストアに停止コールバックを登録
        const stopCallback = async () => {
          isBackgroundRunning = false;
          await BackgroundActions.stop();
        };
        setStopCallback(stopCallback);

        startBackgroundTask();
        setError(null);
      } else {
        setError('バックグラウンドタスクはAndroidのみで利用可能です');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`バックグラウンドタスク開始エラー: ${errorMessage}`);
      console.error('Failed to start background task:', err);
    }
  }, [isAvailable, startBackgroundTask, setStopCallback]);

  /**
   * バックグラウンドタスクを停止
   * 停止後、蓄積した照度から仮データを算出して pendingLastNightStore にセットする
   */
  const stopBackgroundTaskWithSensor = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        isBackgroundRunning = false;
        await BackgroundActions.stop();
        // モニターで記録した照度を集計し、昨夜分の仮データとして保持
        savePendingFromMonitorReadings();
      }
      stopBackgroundTask();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`バックグラウンドタスク停止エラー: ${errorMessage}`);
      console.error('Failed to stop background task:', err);
    }
  }, [stopBackgroundTask]);

  // コンポーネントのアンマウント時にセンサーとタスクを停止
  useEffect(() => {
    return () => {
      stopSensor();
      // if (isBackgroundTaskActive) {
      //   stopBackgroundTaskWithSensor();
      // }
    };
  }, [stopSensor]);

  return {
    data,
    isAvailable,
    isActive,
    isBackgroundActive: isBackgroundTaskActive,
    sleepEnvironment,
    startSensor,
    stopSensor,
    startBackgroundTask: startBackgroundTaskWithSensor,
    stopBackgroundTask: stopBackgroundTaskWithSensor,
    error,
  };
};
