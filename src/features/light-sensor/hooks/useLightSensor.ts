import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { LightSensor } from 'expo-sensors';
import BackgroundActions from 'react-native-background-actions';
import { LIGHT_CONSTANTS, BACKGROUND_CONSTANTS } from '../constants';
import { useLightSensorStore } from '../LightSensorStore';
import type { LightSensorData, SleepEnvironment } from '../types';

let isBackgroundRunning = false;

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

const backgroundSensorTask = async (taskDataArguments: any): Promise<void> => {
  // パラメータからdelayを取得（デフォルト1000ms）
  const { delay = 1000 } = taskDataArguments;

  try {
    LightSensor.setUpdateInterval(BACKGROUND_CONSTANTS.BACKGROUND_SENSOR_UPDATE_INTERVAL);
    const subscription = LightSensor.addListener(sensorData => {
      console.log('[Background] illuminance:', sensorData.illuminance, 'lux');
      // ※ZustandやAsyncStorageに保存する処理をここに記述
    });
    let count = 0;
    // 【重要】タスクを稼働させ続けるためのループ
    while (isBackgroundRunning) {
      await sleep(delay);
      count++;
      // ★ 生存確認用のログを追加
      console.log(`[Alive Check] Task is running... ${count} seconds`);
    }

    // ループを抜けたら（タスクが停止されたら）クリーンアップ
    subscription.remove();
  } catch (error) {
    console.error('[Background] Error in light sensor task:', error);
  }
};

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
      console.log('[Foreground] illuminance:', sensorData.illuminance, 'lux');
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
   */
  const stopBackgroundTaskWithSensor = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        isBackgroundRunning = false;
        await BackgroundActions.stop();
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
