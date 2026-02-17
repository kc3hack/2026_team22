import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '@shared/constants';

interface PlanStatusProps {
    /** ローディング中か */
    isLoading: boolean;
    /** エラーメッセージ */
    error: string | null;
    /** リトライコールバック */
    onRetry: () => void;
}

/**
 * ローディング・エラー状態を表示するコンポーネント
 */
export const PlanStatus: React.FC<PlanStatusProps> = ({ isLoading, error, onRetry }) => {
    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>睡眠プランを生成中...</Text>
                <Text style={styles.subText}>AIがあなたに最適なプランを計算しています</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>プランの取得に失敗しました</Text>
                <Text style={styles.errorDetail}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryText}>再試行</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.dark,
        marginTop: 20,
    },
    subText: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
    },
    errorIcon: {
        fontSize: 40,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.error,
        marginBottom: 8,
    },
    errorDetail: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});
