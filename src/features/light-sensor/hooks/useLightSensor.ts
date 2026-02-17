import { useState, useEffect, useCallback } from 'react';
import { LightSensor } from 'expo-sensors';
import { LIGHT_CONSTANTS } from '../constants';
import type { LightSensorData, SleepEnvironment } from '../types';

interface UseLightSensorReturn {
  /** センサーデータ */
  data: LightSensorData | null;
  /** センサーが利用可能かどうか */
  isAvailable: boolean;
  /** センサーが動作中かどうか */
  isActive: boolean;
  /** 睡眠環境の評価 */
  sleepEnvironment: SleepEnvironment | null;
  /** センサーを開始 */
  startSensor: () => void;
  /** センサーを停止 */
  stopSensor: () => void;
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

/**
 * 照度センサーを使用するカスタムフック
 */
export const useLightSensor = (): UseLightSensorReturn => {
  const [data, setData] = useState<LightSensorData | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sleepEnvironment, setSleepEnvironment] = useState<SleepEnvironment | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    const subscription = LightSensor.addListener(sensorData => {
      setData({ illuminance: sensorData.illuminance });
      setSleepEnvironment(evaluateSleepEnvironment(sensorData.illuminance));
    });

    setIsActive(true);

    // クリーンアップ用にsubscriptionを返す
    return () => {
      subscription.remove();
      setIsActive(false);
    };
  }, [isAvailable]);

  const stopSensor = useCallback(() => {
    LightSensor.removeAllListeners();
    setIsActive(false);
  }, []);

  // コンポーネントのアンマウント時にセンサーを停止
  useEffect(() => {
    return () => {
      LightSensor.removeAllListeners();
    };
  }, []);

  return {
    data,
    isAvailable,
    isActive,
    sleepEnvironment,
    startSensor,
    stopSensor,
    error,
  };
};
