import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

interface UseUsageTrackerReturn {
  /** 累積操作時間（分） */
  usageMinutes: number;
  /** アプリ外にいるかどうか */
  isOutsideApp: boolean;
  /** 追跡を開始 */
  startTracking: () => void;
  /** 追跡を停止 */
  stopTracking: () => void;
  /** カウンターをリセット */
  resetCounter: () => void;
}

/**
 * スマホ操作時間追跡フック
 *
 * 方式:
 *   このアプリがバックグラウンドに移行した時刻を記録し、
 *   フォアグラウンドに復帰した際にその差分を「スマホ操作時間」として加算する。
 *
 * 理由:
 *   就寝準備中にこの監視アプリを閉じて他のアプリ（SNS等）を使うことが
 *   「スマホ操作」にあたるため、アプリ外にいた時間＝操作時間とみなす。
 *   （アプリを開いて睡眠モニターを見ている時間は操作時間に含めない）
 *
 * 注意:
 *   内部では秒単位で累積し、表示用に分に変換する。
 *   これにより短い切り替え（30秒+40秒）も正しく累積される。
 */
export const useUsageTracker = (): UseUsageTrackerReturn => {
  /** 累積操作秒数（内部用） */
  const [usageSeconds, setUsageSeconds] = useState(0);
  const [isOutsideApp, setIsOutsideApp] = useState(false);
  const [, setIsTracking] = useState(false);

  /** バックグラウンドに移行した時刻（ms） */
  const backgroundStartRef = useRef<number | null>(null);
  /** 追跡中フラグ（AppStateコールバック内で参照するためrefで保持） */
  const isTrackingRef = useRef(false);

  // AppStateの変化をリスニング
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (!isTrackingRef.current) return;

      if (nextState === 'active') {
        // フォアグラウンドに復帰 → バックグラウンドにいた時間を加算
        setIsOutsideApp(false);

        if (backgroundStartRef.current !== null) {
          const backgroundMs = Date.now() - backgroundStartRef.current;
          const backgroundSecs = Math.floor(backgroundMs / 1000);

          if (backgroundSecs > 0) {
            setUsageSeconds(prev => prev + backgroundSecs);
          }

          backgroundStartRef.current = null;
        }
      } else {
        // バックグラウンドまたはinactiveへ移行 → 時刻を記録
        if (backgroundStartRef.current === null) {
          backgroundStartRef.current = Date.now();
          setIsOutsideApp(true);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const startTracking = useCallback(() => {
    setIsTracking(true);
    isTrackingRef.current = true;
    backgroundStartRef.current = null;
  }, []);

  const stopTracking = useCallback(() => {
    // 停止時にバックグラウンドにいた場合、その分も加算
    if (backgroundStartRef.current !== null) {
      const backgroundMs = Date.now() - backgroundStartRef.current;
      const backgroundSecs = Math.floor(backgroundMs / 1000);
      if (backgroundSecs > 0) {
        setUsageSeconds(prev => prev + backgroundSecs);
      }
      backgroundStartRef.current = null;
    }

    setIsTracking(false);
    isTrackingRef.current = false;
    setIsOutsideApp(false);
  }, []);

  const resetCounter = useCallback(() => {
    setUsageSeconds(0);
    backgroundStartRef.current = null;
  }, []);

  return {
    // 秒を分に変換（切り上げ: 1秒でも操作していれば1分として表示）
    usageMinutes: Math.ceil(usageSeconds / 60),
    isOutsideApp,
    startTracking,
    stopTracking,
    resetCounter,
  };
};
