/**
 * Shared Libraries - Public API
 */
export { supabase, isSupabaseConfigured } from './supabase';
export { authenticatedFetch, apiV1Fetch, getAccessToken, getApiBaseUrl } from './apiClient';
export type { AuthenticatedFetchOptions } from './apiClient';

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
} from './notifications';
