import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@shared/constants';
import type { SleepLogEntry } from '../types';

interface ScoreBreakdownProps {
    log: SleepLogEntry;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ log }) => {
    const items = [
        { label: 'スマホ使用', value: -log.usagePenalty, color: COLORS.error },
        { label: '環境（光・音）', value: -log.environmentPenalty, color: COLORS.error },
        { label: 'ボーナス', value: log.bonus, color: COLORS.success }, // Fixed to handle positive bonus
    ].filter((item) => item.value !== 0);

    if (items.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>スコア内訳</Text>
                <Text style={styles.perfectText}>✨ 減点なし！完璧です</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>スコア内訳</Text>
            {items.map((item, index) => (
                <View key={index} style={styles.row}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={[styles.value, { color: item.color }]}>
                        {item.value > 0 ? '+' : ''}
                        {item.value}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.dark,
        marginBottom: 16, // Increased margin for better spacing
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: '#94A3B8',
        fontSize: 14,
    },
    value: {
        fontSize: 16,
        fontWeight: '700',
    },
    perfectText: {
        color: COLORS.success,
        textAlign: 'center',
        fontWeight: '600',
        marginTop: 8,
    },
});
