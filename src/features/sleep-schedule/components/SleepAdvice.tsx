import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSleepSchedule } from '../hooks/useSleepSchedule';
import { COLORS } from '@shared/constants';

export const SleepAdvice = () => {
    const { advice, loading, fetchAdvice } = useSleepSchedule();

    useEffect(() => {
        fetchAdvice();
    }, [fetchAdvice]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>スケジュールを分析中...</Text>
            </View>
        );
    }

    if (!advice) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🤖 Pre-Sleep Boost</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.recommendationLabel}>今日のおすすめ就寝時刻</Text>
                <Text style={styles.time}>{advice.recommendedBedtime}</Text>
                <Text style={styles.reason}>{advice.reason}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 16,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    header: {
        marginBottom: 12,
    },
    title: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        alignItems: 'center',
    },
    recommendationLabel: {
        color: '#94A3B8',
        fontSize: 14,
        marginBottom: 4,
    },
    time: {
        color: '#fff',
        fontSize: 40,
        fontWeight: 'bold',
        marginBottom: 12,
        fontVariant: ['tabular-nums'],
    },
    reason: {
        color: '#CBD5E1',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    loadingText: {
        color: '#94A3B8',
        marginTop: 8,
        fontSize: 12,
    },
});
