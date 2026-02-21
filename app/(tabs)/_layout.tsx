import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '@features/auth/authStore';

/**
 * Tab Layout
 * タブナビゲーションの設定。
 * 未認証の場合はログインへリダイレクトする。
 */
export default function TabLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      // ルートのナビゲータがマウントした後に遷移するよう遅延する
      const t = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="sleep-plan"
        options={{
          title: 'プラン',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="sleep-monitor"
        options={{
          title: 'モニター',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🌙</Text>,
        }}
      />
      <Tabs.Screen
        name="sleep-log"
        options={{
          title: 'ログ',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="light-sensor"
        options={{
          title: '照度',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💡</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
