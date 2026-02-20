import { create } from 'zustand';
import { BACKGROUND_CONSTANTS } from './constants';

/**
 * バックグラウンドタスクの状態を管理するストア
 */
interface LightSensorStore {
  /** バックグラウンドタスクが実行中かどうか */
  isBackgroundTaskActive: boolean;
  /** バックグラウンドタスク開始関数 */
  startBackgroundTask: () => void;
  /** バックグラウンドタスク停止関数 */
  stopBackgroundTask: () => void;
  /** バックグラウンドタスク停止時のコールバック */
  setStopCallback: (callback: () => void) => void;
  /** 停止用コールバック */
  stopCallback: (() => void) | null;
}

export const useLightSensorStore = create<LightSensorStore>(set => ({
  isBackgroundTaskActive: false,
  stopCallback: null,

  startBackgroundTask: () => {
    set({ isBackgroundTaskActive: true });
  },

  stopBackgroundTask: () => {
    set(state => {
      if (state.stopCallback) {
        state.stopCallback();
      }
      return { isBackgroundTaskActive: false };
    });
  },

  setStopCallback: callback => {
    set({ stopCallback: callback });
  },
}));
