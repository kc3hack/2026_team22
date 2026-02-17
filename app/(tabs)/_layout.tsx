import { Tabs } from 'expo-router';
import { Text } from 'react-native';

/**
 * Tab Layout
 * タブナビゲーションの設定
 */
export default function TabLayout() {
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
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
