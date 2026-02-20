import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useAlarm, AlarmScreen } from '@features/alarm';

/**
 * Root Layout
 * アプリ全体のProvider設定やグローバルな設定を行う
 */
export default function RootLayout() {
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
