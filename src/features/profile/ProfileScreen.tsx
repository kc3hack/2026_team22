import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '@shared/constants';

/**
 * プロフィール画面
 * ユーザー情報や設定を表示
 */
export const ProfileScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>プロフィール</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>設定</Text>
          <Text style={styles.cardText}>Coming soon...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.dark,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: COLORS.background.dark,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.dark,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.text.dark,
    opacity: 0.7,
  },
});
