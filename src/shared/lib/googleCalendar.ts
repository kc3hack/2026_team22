/**
 * Google Calendar クライアント
 *
 * TODO: Google Calendar API に接続
 *
 * 使用例:
 * ```typescript
 * import { googleCalendar } from '@shared/lib/googleCalendar';
 * const events = await googleCalendar.getEvents();
 * await googleCalendar.createEvent({ title: '睡眠時間', start: ..., end: ... });
 * ```
 */

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

interface CalendarConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  icsUrl?: string; // 公開ICSカレンダーのURL
}

class GoogleCalendarClient {
  private config: CalendarConfig;
  private isAuthenticated: boolean = false;

  constructor(config: CalendarConfig = {}) {
    this.config = config;
  }

  /**
   * 設定を更新
   */
  configure(config: Partial<CalendarConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Google認証を開始
   */
  async authenticate(): Promise<boolean> {
    // TODO: Google OAuth認証を実装
    console.warn('[GoogleCalendar] Starting authentication...');

    // プレースホルダー
    this.isAuthenticated = true;
    return true;
  }

  /**
   * 認証状態を確認
   */
  getAuthStatus(): boolean {
    return this.isAuthenticated;
  }

  /**
   * ICSファイルをフェッチして解析
   */
  private async fetchAndParseIcs(url: string): Promise<CalendarEvent[]> {
    try {
      console.warn(`[GoogleCalendar] Fetching ICS from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ICS: ${response.statusText}`);
      }
      const icsData = await response.text();
      return this.parseIcs(icsData);
    } catch (error) {
      console.error('[GoogleCalendar] Error fetching ICS:', error);
      return [];
    }
  }

  /**
   * シンプルなICSパーサー
   * 基本的な VEVENT, DTSTART, DTEND, SUMMARY, DESCRIPTION を解析
   */
  private parseIcs(icsData: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const lines = icsData.split(/\r\n|\n|\r/);
    let currentEvent: Partial<CalendarEvent> | null = null;
    let inEvent = false;

    // 日付パース用ヘルパー (YYYYMMDDTHHMMSSZ or YYYYMMDD)
    const parseIcsDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      // TZID等のパラメータ除去 (例: ;TZID=Asia/Tokyo:2023...)
      const cleanDateStr = dateStr.includes(':') ? dateStr.split(':')[1] : dateStr;

      if (cleanDateStr.length === 8) {
        // YYYYMMDD (All day)
        const y = parseInt(cleanDateStr.substring(0, 4), 10);
        const m = parseInt(cleanDateStr.substring(4, 6), 10) - 1;
        const d = parseInt(cleanDateStr.substring(6, 8), 10);
        return new Date(y, m, d);
      } else if (cleanDateStr.length >= 15) {
        // YYYYMMDDTHHMMSS
        const y = parseInt(cleanDateStr.substring(0, 4), 10);
        const m = parseInt(cleanDateStr.substring(4, 6), 10) - 1;
        const d = parseInt(cleanDateStr.substring(6, 8), 10);
        const h = parseInt(cleanDateStr.substring(9, 11), 10);
        const min = parseInt(cleanDateStr.substring(11, 13), 10);
        const s = parseInt(cleanDateStr.substring(13, 15), 10);

        // Zがついている場合はUTCとして扱い、ローカルに変換（簡易対応）
        // 本来はTZIDを考慮すべきだが、ここでは端末のローカルタイムとして解釈するか、
        // 単純にDateオブジェクトにする。
        if (cleanDateStr.endsWith('Z')) {
          return new Date(Date.UTC(y, m, d, h, min, s));
        }
        return new Date(y, m, d, h, min, s);
      }
      return null;
    };

    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        inEvent = true;
        currentEvent = {};
        continue;
      }
      if (line.startsWith('END:VEVENT')) {
        if (
          inEvent &&
          currentEvent &&
          currentEvent.title &&
          currentEvent.start &&
          currentEvent.end
        ) {
          events.push(currentEvent as CalendarEvent);
        }
        inEvent = false;
        currentEvent = null;
        continue;
      }

      if (inEvent && currentEvent) {
        if (line.startsWith('SUMMARY:')) {
          currentEvent.title = line.substring(8);
        } else if (line.startsWith('DESCRIPTION:')) {
          currentEvent.description = line.substring(12);
        } else if (line.startsWith('DTSTART')) {
          // Check if this is an all-day event
          const dateStr = line.includes(':') ? line.split(':')[1] : line;
          if (dateStr && dateStr.length === 8) {
            currentEvent.allDay = true;
          }
          const date = parseIcsDate(line);
          if (date) currentEvent.start = date;
        } else if (line.startsWith('DTEND')) {
          const date = parseIcsDate(line);
          if (date) currentEvent.end = date;
        } else if (line.startsWith('UID:')) {
          currentEvent.id = line.substring(4);
        }
      }
    }

    return events;
  }

  /**
   * イベント一覧を取得
   */
  async getEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    if (this.config.icsUrl) {
      const events = await this.fetchAndParseIcs(this.config.icsUrl);

      // フィルタリング
      return events.filter(event => {
        if (startDate && event.end < startDate) return false;
        // endDateフィルタは必要に応じて
        if (endDate && event.start > endDate) return false;
        return true;
      });
    }

    console.warn('[GoogleCalendar] No ICS URL configured. Returning dummy data.');

    // プレースホルダー (ICS URLがない場合のみ)
    return [
      {
        id: '1',
        title: 'サンプルイベント',
        start: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours later
        end: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
      {
        id: '2',
        title: '早朝会議',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(9, 0, 0, 0) as unknown as Date, // Tomorrow 9 AM
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(10, 0, 0, 0) as unknown as Date,
      },
      // テスト用データ追加
      {
        id: '3',
        title: '深夜作業',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(2, 0, 0, 0) as unknown as Date,
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(3, 0, 0, 0) as unknown as Date,
      },
    ];
  }

  /**
   * イベントを作成
   */
  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> {
    // TODO: 実際のAPI呼び出しを実装
    console.warn('[GoogleCalendar] Creating event:', event);

    // プレースホルダー
    return {
      id: 'new-event-id',
      ...event,
    };
  }

  /**
   * イベントを更新
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    // TODO: 実際のAPI呼び出しを実装
    console.warn('[GoogleCalendar] Updating event:', { eventId, event });

    return null;
  }

  /**
   * イベントを削除
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    // TODO: 実際のAPI呼び出しを実装
    console.warn('[GoogleCalendar] Deleting event:', eventId);

    return true;
  }
}

// シングルトンインスタンス
export const googleCalendar = new GoogleCalendarClient();

export type { CalendarEvent, CalendarConfig };
