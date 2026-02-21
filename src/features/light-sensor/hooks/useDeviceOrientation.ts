import { useState, useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

export type DeviceOrientation = 'face_up' | 'face_down';

interface UseDeviceOrientationReturn {
  orientation: DeviceOrientation;
}

const DEBOUNCE_COUNT = 3;
const UPDATE_INTERVAL_MS = 500;

function classifyOrientation(z: number): DeviceOrientation {
  if (z < -0.5) return 'face_down';
  return 'face_up';
}

/**
 * デバイスの向き（face_up / face_down）を判定するカスタムフック。
 * 加速度センサーのZ成分を使い、チャタリング防止のため3回連続同じ判定で状態を切り替える。
 */
export function useDeviceOrientation(): UseDeviceOrientationReturn {
  const [orientation, setOrientation] = useState<DeviceOrientation>('face_up');
  const pendingRef = useRef<DeviceOrientation>('face_up');
  const countRef = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);

    const subscription = Accelerometer.addListener(({ z }) => {
      const detected = classifyOrientation(z);

      if (detected === pendingRef.current) {
        countRef.current += 1;
      } else {
        pendingRef.current = detected;
        countRef.current = 1;
      }

      if (countRef.current >= DEBOUNCE_COUNT) {
        setOrientation(prev => (prev !== detected ? detected : prev));
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { orientation };
}
