import { useState, useEffect } from 'react';
import { LightSensor } from 'expo-sensors';

interface UseLightSensorReturn {
  /** 照度値（lux）。利用不可またはデータ未取得時は null */
  lux: number | null;
  /** 照度センサーが利用可能かどうか */
  available: boolean;
}

const UPDATE_INTERVAL_MS = 1000;

/**
 * 照度センサーから環境の明るさ（lux）を取得するカスタムフック。
 *
 * TODO: iOSでは照度センサーが利用不可。iOS対応は将来課題。
 */
export function useLightSensor(): UseLightSensorReturn {
  const [lux, setLux] = useState<number | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let subscription: ReturnType<typeof LightSensor.addListener> | null = null;

    const init = async () => {
      try {
        const isAvailable = await LightSensor.isAvailableAsync();
        setAvailable(isAvailable);

        if (!isAvailable) {
          // TODO: iOSでは照度センサーが利用不可
          console.warn('[useLightSensor] LightSensor is not available on this device');
          return;
        }

        LightSensor.setUpdateInterval(UPDATE_INTERVAL_MS);
        subscription = LightSensor.addListener((data) => {
          console.log(`[LightSensor] lux=${data.illuminance.toFixed(1)}`);
          setLux(data.illuminance);
        });
      } catch (e) {
        console.warn('[useLightSensor] Error initializing LightSensor:', e);
        setAvailable(false);
      }
    };

    init();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { lux, available };
}
