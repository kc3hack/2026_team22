import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

/**
 * 404 Not Found Screen
 */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'ページが見つかりません' }} />
      <View style={styles.container}>
        <Text style={styles.title}>ページが見つかりません</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>ホームに戻る</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#6366F1',
  },
});
