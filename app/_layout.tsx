import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useAlarm, AlarmScreen } from '@features/alarm';
import { supabase } from '@shared/lib';
import { useAuthStore } from '@features/auth/authStore';

/**
 * Root Layout
 * アプリ全体のProvider設定やグローバルな設定を行う。
 * 起動時にセッションを確認し、認証できていなければログインへ遷移する。
 */
export default function RootLayout() {
  const router = useRouter();
  const setUser = useAuthStore(s => s.setUser);

  // 起動時: セッション確認 → 未認証ならログインへ、認証済みならタブへ
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.name ?? session.user.email ?? undefined,
        });
        router.replace('/(tabs)');
      } else {
        setUser(null);
        router.replace('/(auth)/login');
      }
    })();
    return () => { cancelled = true; };
  }, [router, setUser]);

  // Global Alarm Logic
  const { isAlarmRinging } = useAlarm();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1E293B' },
        }}
        initialRouteName="(auth)"
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      {/* Alarm Overlay */}
      {isAlarmRinging && (
        <View style={styles.alarmOverlay}>
          <AlarmScreen />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  alarmOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
