import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useScheduleReminder } from '@features/sleep-settings';

/**
 * Root Layout
 * アプリ全体のProvider設定やグローバルな設定を行う
 */
export default function RootLayout() {
  // 就寝リマインダー通知のスケジュール管理
  useScheduleReminder();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1E293B' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
