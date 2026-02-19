/**
 * Shared Libraries - Public API
 */
export { llmClient } from './llm';
export type { LLMConfig, ChatMessage, ChatResponse } from './llm';

export { googleCalendar } from './googleCalendar';
export type { CalendarEvent, CalendarConfig } from './googleCalendar';

export { geminiClient } from './gemini';
export type { GeminiConfig, WarningContext } from './gemini';

export {
    initializeNotifications,
    sendLocalNotification,
    canSendNotification,
    resetNotificationCooldowns,
    scheduleBedtimeReminder,
    cancelBedtimeReminder,
    getReminderTimeString,
} from './notifications';
