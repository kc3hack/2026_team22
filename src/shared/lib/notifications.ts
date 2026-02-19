/**
 * プッシュ通知ユーティリティ
 *
 * expo-notifications をラップし、ローカル通知の送信とクールダウン制御を提供する。
 *
 * 使用例:
 * ```typescript
 * import { initializeNotifications, sendLocalNotification, canSendNotification } from '@shared/lib/notifications';
 *
 * await initializeNotifications();
 * if (canSendNotification('light', 60000)) {
 *   await sendLocalNotification('環境警告', '部屋が明るすぎます');
 * }
 * ```
 */

import * as Notifications from 'expo-notifications';

/** クールダウン管理用のタイムスタンプマップ */
const lastSentMap = new Map<string, number>();

/**
 * 通知を初期化する
 *
 * - フォアグラウンドでの通知表示を有効化
 * - 通知権限をリクエスト
 *
 * @returns 権限が許可されたかどうか
 */
export const initializeNotifications = async (): Promise<boolean> => {
    // フォアグラウンドでも通知を表示
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    // 権限をリクエスト
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('[Notifications] 通知権限が許可されませんでした');
        return false;
    }

    return true;
};

/**
 * ローカルプッシュ通知を送信する
 *
 * @param title - 通知タイトル
 * @param body - 通知本文
 */
export const sendLocalNotification = async (
    title: string,
    body: string
): Promise<void> => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            trigger: null, // 即時送信
        });
    } catch (error) {
        console.error('[Notifications] 通知の送信に失敗しました:', error);
    }
};

/**
 * クールダウンを考慮して通知を送信可能か判定する
 *
 * 同じ key に対して cooldownMs 以内に再送信を防止する。
 * 送信可能な場合、タイムスタンプを自動更新する。
 *
 * @param key - 通知の種別キー（例: 'light', 'noise', 'usage_phase1'）
 * @param cooldownMs - クールダウン時間（ミリ秒）
 * @returns 送信可能かどうか
 */
export const canSendNotification = (key: string, cooldownMs: number): boolean => {
    const now = Date.now();
    const lastSent = lastSentMap.get(key);

    if (lastSent && now - lastSent < cooldownMs) {
        return false;
    }

    lastSentMap.set(key, now);
    return true;
};

/**
 * クールダウンのタイムスタンプをリセットする
 *
 * 監視を停止する際に呼び出す。
 */
export const resetNotificationCooldowns = (): void => {
    lastSentMap.clear();
};

// ─────────────────────────────────────────────
// 就寝リマインダー通知
// ─────────────────────────────────────────────

/** 就寝リマインダー通知の固定ID */
const BEDTIME_REMINDER_ID = 'bedtime-reminder';

/**
 * 就寝リマインダー通知をスケジュールする
 * 指定された就寝時刻の1時間前に毎日通知を送る
 *
 * @param sleepHour 就寝予定時刻（時）
 * @param sleepMinute 就寝予定時刻（分）
 */
export const scheduleBedtimeReminder = async (
    sleepHour: number,
    sleepMinute: number,
): Promise<void> => {
    // 権限チェック
    const granted = await initializeNotifications();
    if (!granted) return;

    // 既存のリマインダーをキャンセル
    await cancelBedtimeReminder();

    // 1時間前を計算
    let reminderHour = sleepHour - 1;
    if (reminderHour < 0) {
        reminderHour += 24;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: BEDTIME_REMINDER_ID,
            content: {
                title: '🌙 おやすみ準備の時間です',
                body: `就寝予定時刻 ${sleepHour.toString().padStart(2, '0')}:${sleepMinute.toString().padStart(2, '0')} まであと1時間です。睡眠モニターを起動しましょう。`,
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: reminderHour,
                minute: sleepMinute,
            },
        });
    } catch (error) {
        console.error('[Notifications] リマインダーのスケジュールに失敗:', error);
    }
};

/**
 * 就寝リマインダー通知をキャンセルする
 */
export const cancelBedtimeReminder = async (): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(BEDTIME_REMINDER_ID);
    } catch {
        // 既にキャンセル済み or 存在しない場合は無視
    }
};

/**
 * リマインダーの通知時刻を "HH:mm" 形式で返す
 *
 * @param sleepHour 就寝予定時刻（時）
 * @param sleepMinute 就寝予定時刻（分）
 * @returns "HH:mm" 形式の文字列
 */
export const getReminderTimeString = (
    sleepHour: number,
    sleepMinute: number,
): string => {
    let reminderHour = sleepHour - 1;
    if (reminderHour < 0) reminderHour += 24;
    return `${reminderHour.toString().padStart(2, '0')}:${sleepMinute.toString().padStart(2, '0')}`;
};
