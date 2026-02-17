import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { NOISE_CONFIG, ENVIRONMENT_THRESHOLDS } from '../constants';

interface UseNoiseSensorReturn {
  /** 現在の音圧レベル（dB） */
  noiseDb: number | null;
  /** NGラインを超えているか */
  isExceeded: boolean;
  /** センサーが利用可能か */
  isAvailable: boolean;
  /** 測定中かどうか */
  isActive: boolean;
  /** 測定を開始 */
  startSensor: () => Promise<void>;
  /** 測定を停止 */
  stopSensor: () => Promise<void>;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * 音圧センサーフック
 *
 * expo-avのAudio APIを使い、マイク入力の音圧レベル（dB）を取得する。
 * 録音データは保存せず、メータリング値（dB）のみを使用。
 */
export const useNoiseSensor = (): UseNoiseSensorReturn => {
  const [noiseDb, setNoiseDb] = useState<number | null>(null);
  const [isExceeded, setIsExceeded] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 利用可能性チェック
  useEffect(() => {
    // Webプラットフォームではマイクが使えない場合がある
    if (Platform.OS === 'web') {
      setError('音圧センサーはモバイルデバイスでのみ利用可能です');
      setIsAvailable(false);
    } else {
      setIsAvailable(true);
    }
  }, []);

  const startSensor = useCallback(async () => {
    if (!isAvailable) {
      setError('音圧センサーが利用できません');
      return;
    }

    try {
      setError(null);

      // マイク権限を要求
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('マイクの権限が許可されていません');
        return;
      }

      // オーディオモードを設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 録音を開始（メータリングのみ使用）
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.LOW_QUALITY,
        isMeteringEnabled: true,
      });
      await recording.startAsync();
      recordingRef.current = recording;

      // 定期的にメータリング値を取得
      intervalRef.current = setInterval(async () => {
        try {
          if (recordingRef.current) {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording && status.metering !== undefined) {
              // expo-avのメータリング値はdBFS(-160〜0)で返るので、
              // 概算のdB SPLに変換（あくまで目安値）
              const dbSpl = Math.max(0, status.metering + 100);
              setNoiseDb(Math.round(dbSpl));
              setIsExceeded(dbSpl >= ENVIRONMENT_THRESHOLDS.NOISE_MAX_DB);
            }
          }
        } catch {
          // サイレントにエラーを処理（測定値をnullに）
          setNoiseDb(null);
        }
      }, NOISE_CONFIG.SAMPLE_INTERVAL_MS);

      setIsActive(true);
    } catch {
      setError('音圧測定の開始に失敗しました');
      setIsActive(false);
    }
  }, [isAvailable]);

  const stopSensor = useCallback(async () => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (recordingRef.current) {
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording) {
          await recordingRef.current.stopAndUnloadAsync();
        }
        recordingRef.current = null;
      }

      setIsActive(false);
      setNoiseDb(null);
    } catch {
      // stop時のエラーは無視
      setIsActive(false);
    }
  }, []);

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  return {
    noiseDb,
    isExceeded,
    isAvailable,
    isActive,
    startSensor,
    stopSensor,
    error,
  };
};
