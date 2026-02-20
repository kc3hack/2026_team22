export type AlarmPhase = 'idle' | 'gentle' | 'strict' | 'completed';

export interface AlarmSettings {
  /** レジリエンスウィンドウ（分）：Phase 1の継続時間 */
  resilienceWindowMinutes: number;
  /** アラーム音量（0.0 - 1.0） */
  volume: number;
  /** バイブレーション有効 */
  vibrationEnabled: boolean;
  /** ミッション有効 */
  missionEnabled: boolean;
  /** ミッション対象（例：'washroom'） */
  missionTarget: string;
}

export interface AlarmState {
  isAlarmRinging: boolean;
  currentPhase: AlarmPhase;
  settings: AlarmSettings;
  /** スヌーズ中か */
  isSnoozed: boolean;
}
