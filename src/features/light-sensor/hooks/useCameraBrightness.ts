import { useState, useEffect, useRef, useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';
import { luminanceToLux } from '../../../utils/luminance';

const { Camera2Brightness } = NativeModules;

interface UseCameraBrightnessReturn {
  /** カメラ輝度から推定したlux近似値。無効時や未取得時は null */
  estimatedLux: number | null;
  /** カメラが有効に動作中かどうか */
  active: boolean;
}

const SNAPSHOT_INTERVAL_MS = 5_000;

/**
 * Camera2 API（ネイティブモジュール）を使って固定露出で撮影し、
 * 環境の相対輝度を推定するカスタムフック。
 *
 * @param enabled true の場合のみ撮影を行う
 */
export function useCameraBrightness(enabled: boolean): UseCameraBrightnessReturn {
  const [estimatedLux, setEstimatedLux] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const captureAndAnalyze = useCallback(async () => {
    if (Platform.OS !== 'android' || !Camera2Brightness) {
      return;
    }
    try {
      const indicator: number = await Camera2Brightness.captureAverageBrightness();
      const lux = luminanceToLux(indicator);
      console.log(`[Camera] AE indicator=${indicator.toFixed(4)} → lux=${lux.toFixed(1)}`);
      setEstimatedLux(lux);
    } catch (e) {
      console.warn('[useCameraBrightness] Capture error:', e);
    }
  }, []);

  useEffect(() => {
    if (enabled && Platform.OS === 'android' && Camera2Brightness) {
      setActive(true);

      // Initial capture with small delay
      const initialTimeout = setTimeout(() => {
        captureAndAnalyze();
        intervalRef.current = setInterval(captureAndAnalyze, SNAPSHOT_INTERVAL_MS);
      }, 1000);

      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setActive(false);
      };
    } else {
      setActive(false);
      setEstimatedLux(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [enabled, captureAndAnalyze]);

  return { estimatedLux, active };
}
