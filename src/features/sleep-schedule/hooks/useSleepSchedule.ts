import { useState, useCallback } from 'react';
import { googleCalendar } from '@shared/lib/googleCalendar';
import { useSleepSettingsStore } from '../../sleep-settings/sleepSettingsStore';

interface SleepAdvice {
  recommendedBedtime: string; // HH:mm
  reason: string;
}

export const useSleepSchedule = () => {
  const { sleepDurationHours, preparationMinutes, icsUrl } = useSleepSettingsStore();
  const [advice, setAdvice] = useState<SleepAdvice | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdvice = useCallback(async () => {
    setLoading(true);
    try {
      if (icsUrl) {
        googleCalendar.configure({ icsUrl });
      }
      const events = await googleCalendar.getEvents();

      // Simple logic: Find earliest event tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const tomorrowEvents = events.filter(e => {
        const eventDate = new Date(e.start); // Assuming start is ISO string or timestamp
        return eventDate >= tomorrow && eventDate <= tomorrowEnd;
      });

      // Sort by start time
      tomorrowEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      let wakeUpTime: Date;

      if (tomorrowEvents.length > 0) {
        const firstEvent = tomorrowEvents[0];
        const firstEventTime = new Date(firstEvent.start);

        // Use user's preparation time + 30 mins (assumed commute) for safety
        const commuteMinutes = 30;
        wakeUpTime = new Date(
          firstEventTime.getTime() - (preparationMinutes + commuteMinutes) * 60 * 1000
        );
      } else {
        // Default wake up time if no events
        // Use user settings (mocking accessing store state relative to date)
        wakeUpTime = new Date(tomorrow);
        wakeUpTime.setHours(7, 0, 0, 0); // Default 7 AM
      }

      // Calculate bedtime
      const bedTime = new Date(wakeUpTime.getTime() - sleepDurationHours * 60 * 60 * 1000);

      // Generate text using Gemini (or mock) based on schedule
      // "Tomorrow you have [Event] at [Time], so wake up by [WakeTime]."
      const reason =
        tomorrowEvents.length > 0
          ? `明日は${tomorrowEvents[0].title}（${new Date(tomorrowEvents[0].start).getHours()}:${new Date(tomorrowEvents[0].start).getMinutes().toString().padStart(2, '0')}）があります。お支度時間${preparationMinutes}分＋移動30分を見込んで、${wakeUpTime.getHours()}:${wakeUpTime.getMinutes().toString().padStart(2, '0')}の起床をおすすめします。`
          : '明日は特に予定がありません。リズムを保つためにいつもの時間に起きましょう。';

      setAdvice({
        recommendedBedtime: `${bedTime.getHours()}:${bedTime.getMinutes().toString().padStart(2, '0')}`,
        reason: reason,
      });
    } catch (error) {
      console.error('Failed to generate sleep advice', error);
      setAdvice(null);
    } finally {
      setLoading(false);
    }
  }, [sleepDurationHours, preparationMinutes, icsUrl]);

  return {
    advice,
    loading,
    fetchAdvice,
  };
};
