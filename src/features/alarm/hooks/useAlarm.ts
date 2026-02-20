import { useEffect, useRef } from 'react';
import { useAlarmStore } from '../alarmStore';
import { useSleepSettingsStore } from '../../sleep-settings/sleepSettingsStore';
import { googleCalendar } from '@shared/lib/googleCalendar'; // Using existing lib
import { Audio } from 'expo-av';

const CHECK_INTERVAL = 1000;
const VOLUME_STEP = 0.05;
const VOLUME_INTERVAL = 10000; // Increase volume every 10 sec in Phase 1

export const useAlarm = () => {
  const alarmStore = useAlarmStore();
  const sleepSettings = useSleepSettingsStore();

  const soundRef = useRef<Audio.Sound | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sound loading and playback
  const playSound = async (phase: 'gentle' | 'strict') => {
    try {
      // Unload existing sound if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const source =
        phase === 'gentle'
          ? require('../../../../assets/sounds/alarm_gentle.mp3')
          : require('../../../../assets/sounds/alarm_strict.mp3');

      const initialVolume = phase === 'gentle' ? alarmStore.volume : 1.0;

      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
        isLooping: true,
        volume: initialVolume,
      });
      soundRef.current = sound;
    } catch (e) {
      console.warn(`Error playing ${phase} sound`, e);
    }
  };

  const stopSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  // Adjust resilience window based on importance and deadline
  const getAdjustedWindow = async (alarmStartTime: number): Promise<number> => {
    const events = await googleCalendar.getEvents();
    const now = new Date(alarmStartTime);
    const todayStr = now.toDateString();

    // 1. Find the first event of the day (after wake up)
    const todaysEvents = events
      .filter(e => {
        const eDate = new Date(e.start);
        return eDate.toDateString() === todayStr && eDate.getTime() > alarmStartTime;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Default window
    let window = sleepSettings.resilienceWindowMinutes;

    if (todaysEvents.length > 0) {
      const firstEvent = todaysEvents[0];
      const eventStart = new Date(firstEvent.start).getTime();

      // 2. Calculate Deadline: Departure Time = Event Start - 30min (Commute)
      const commuteBuffer = 30 * 60 * 1000;
      const departureTime = eventStart - commuteBuffer;

      // "Must Wake Up" = DepartureTime - PreparationTime.
      const mustWakeUpTime = departureTime - sleepSettings.preparationMinutes * 60 * 1000;
      const timeToSpare = mustWakeUpTime - alarmStartTime; // ms

      const timeToSpareMinutes = Math.floor(timeToSpare / 1000 / 60);

      // If time to spare is positive, that's our max window.
      if (timeToSpareMinutes < window) {
        window = Math.max(0, timeToSpareMinutes);
      }

      // Importance check
      const isImportant =
        firstEvent.title.includes('Important') || firstEvent.title.includes('Test');
      if (isImportant) {
        window = Math.floor(window / 2);
      }
    }

    return window;
  };

  // Check alarm time
  useEffect(() => {
    checkIntervalRef.current = setInterval(async () => {
      if (alarmStore.isAlarmRinging) return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (
        currentHour === sleepSettings.wakeUpHour &&
        currentMinute === sleepSettings.wakeUpMinute &&
        now.getSeconds() < 2 // Check only at 00-01 seconds
      ) {
        alarmStore.startAlarm();
      }
    }, CHECK_INTERVAL);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alarmStore を依存に含めると毎回 interval が張り直されるため意図的に除外
  }, [sleepSettings.wakeUpHour, sleepSettings.wakeUpMinute, alarmStore.isAlarmRinging]);

  // Handle Alarm Ringing State & Phase Changes
  // Monitor phase changes to switch sounds
  useEffect(() => {
    if (alarmStore.isAlarmRinging) {
      // Start playing based on current phase
      // If we are already playing and phase changes, playSound will handle unload/load
      // However, we need to track if we just started or if phase changed.
      // Simplification: logic here triggers on phase change.

      playSound(alarmStore.currentPhase === 'strict' ? 'strict' : 'gentle');

      // Volume increase logic for Phase 1
      if (alarmStore.currentPhase === 'gentle') {
        volumeIntervalRef.current = setInterval(() => {
          const newVol = Math.min(1.0, alarmStore.volume + VOLUME_STEP);
          alarmStore.setVolume(newVol);
        }, VOLUME_INTERVAL);
      } else {
        // Strict Phase: ensure max volume
        alarmStore.setVolume(1.0);
        if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      }
    } else {
      // Stop sound
      stopSound();
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    }

    return () => {
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarmStore.isAlarmRinging, alarmStore.currentPhase]);

  // Handle Phase Transition Timing
  useEffect(() => {
    if (!alarmStore.isAlarmRinging || !alarmStore.alarmStartTime) return;

    const checkPhase = async () => {
      // Optimization: Don't check if already strict
      if (alarmStore.currentPhase === 'strict') return;

      const now = Date.now();
      const elapsedMinutes = (now - alarmStore.alarmStartTime!) / 1000 / 60;

      const window = await getAdjustedWindow(alarmStore.alarmStartTime!);

      if (elapsedMinutes >= window && alarmStore.currentPhase === 'gentle') {
        alarmStore.setPhase('strict');
      }
    };

    const phaseCheck = setInterval(checkPhase, 5000);
    return () => clearInterval(phaseCheck);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getAdjustedWindow は安定した参照でないため除外
  }, [
    alarmStore.isAlarmRinging,
    alarmStore.alarmStartTime,
    alarmStore.currentPhase,
    sleepSettings.resilienceWindowMinutes,
  ]);

  // Watch volume changes to update sound object (only for Gentle phase usually)
  useEffect(() => {
    if (soundRef.current && alarmStore.currentPhase === 'gentle') {
      soundRef.current.setVolumeAsync(alarmStore.volume);
    }
  }, [alarmStore.volume, alarmStore.currentPhase]);

  return {
    ...alarmStore,
  };
};
