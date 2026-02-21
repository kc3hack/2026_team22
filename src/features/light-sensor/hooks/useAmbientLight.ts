import { useEffect, useMemo } from 'react';
import { useDeviceOrientation } from './useDeviceOrientation';
import { useLightSensor } from './useLightSensor';
import { useCameraBrightness } from './useCameraBrightness';
import type { DeviceOrientation } from './useDeviceOrientation';

export type AmbientLightSource = 'light_sensor' | 'camera' | 'unavailable';

interface UseAmbientLightReturn {
  /** 環境照度の推定値（lux）。利用不可時は null */
  lux: number | null;
  /** 照度データのソース */
  source: AmbientLightSource;
  /** デバイスの向き */
  orientation: DeviceOrientation;
  /** センサーが利用可能かどうか */
  isAvailable: boolean;
  /** フォアグラウンドセンサーが動作中かどうか */
  isActive: boolean;
  /** バックグラウンドタスクが実行中かどうか */
  isBackgroundActive: boolean;
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
 * デバイスの向きに応じて照度センサーとカメラを切り替えるフック。
 * センサー制御（開始/停止/バックグラウンド）も統合して提供する。
 *
 * - face_up → 照度センサー（カメラ停止でバッテリー節約）
 * - face_down → カメラ輝度推定
 */
export function useAmbientLight(): UseAmbientLightReturn {
  const { orientation } = useDeviceOrientation();
  const {
    data,
    isAvailable: sensorAvailable,
    isActive,
    isBackgroundActive,
    startSensor,
    stopSensor,
    startBackgroundTask,
    stopBackgroundTask,
    error,
  } = useLightSensor();
  const sensorLux = data?.illuminance ?? null;

  // face_up の時はカメラを起動しない（バッテリー節約）
  const cameraEnabled = orientation !== 'face_up';
  const { estimatedLux: cameraLux, active: cameraActive } = useCameraBrightness(cameraEnabled);

  const result = useMemo((): { lux: number | null; source: AmbientLightSource } => {
    switch (orientation) {
      case 'face_up': {
        if (sensorAvailable && sensorLux !== null) {
          return { lux: sensorLux, source: 'light_sensor' };
        }
        return { lux: null, source: 'unavailable' };
      }

      case 'face_down': {
        if (cameraActive && cameraLux !== null) {
          return { lux: cameraLux, source: 'camera' };
        }
        return { lux: null, source: 'unavailable' };
      }

      default:
        return { lux: null, source: 'unavailable' };
    }
  }, [orientation, sensorLux, sensorAvailable, cameraLux, cameraActive]);

  useEffect(() => {
    console.warn(
      `[useAmbientLight] orientation=${orientation}, source=${result.source}, cameraEnabled=${cameraEnabled}, cameraActive=${cameraActive}, lux=${result.lux}`,
    );
  }, [orientation, result.source, cameraEnabled, cameraActive, result.lux]);

  return {
    lux: result.lux,
    source: result.source,
    orientation,
    isAvailable: sensorAvailable,
    isActive,
    isBackgroundActive,
    startSensor,
    stopSensor,
    startBackgroundTask,
    stopBackgroundTask,
    error,
  };
}
