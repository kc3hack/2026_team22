import { Stack } from 'expo-router';

/**
 * 認証フロー用レイアウト（ログイン・サインアップ）
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1E293B' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
