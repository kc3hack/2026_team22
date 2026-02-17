import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Root Layout
 * アプリ全体のProvider設定やグローバルな設定を行う
 */
export default function RootLayout() {
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
