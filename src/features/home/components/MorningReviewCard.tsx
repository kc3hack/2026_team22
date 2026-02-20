import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '@shared/constants';

/** 気分の選択肢 */
const MOOD_OPTIONS = [
    { value: 1, emoji: '😫', label: '最悪' },
    { value: 2, emoji: '😴', label: 'だるい' },
    { value: 3, emoji: '😐', label: 'ふつう' },
    { value: 4, emoji: '😊', label: '良い' },
    { value: 5, emoji: '🤩', label: '最高' },
];

interface MorningReviewCardProps {
    /** 昨夜の睡眠スコア */
    score: number;
    /** 気分選択時のコールバック */
    onSelectMood: (mood: number) => void;
}

/**
 * 朝の振り返りカード
 * 昨夜のスコアを表示し、5段階の気分フィードバックを入力できる
 */
export const MorningReviewCard: React.FC<MorningReviewCardProps> = ({
    score,
    onSelectMood,
}) => {
    const [selected, setSelected] = useState<number | null>(null);

    const handleSelect = (mood: number) => {
        setSelected(mood);
        // 少し待ってからコールバック（アニメーション用）
        setTimeout(() => onSelectMood(mood), 400);
    };

    const scoreColor =
        score >= 80 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.error;

    return (
        <View style={styles.card}>
            {/* ヘッダー */}
            <View style={styles.headerRow}>
                <Text style={styles.sunEmoji}>🌅</Text>
                <View>
                    <Text style={styles.title}>おはようございます！</Text>
                    <Text style={styles.subtitle}>昨夜の睡眠を振り返りましょう</Text>
                </View>
            </View>

            {/* スコア表示 */}
            <View style={styles.scoreSection}>
                <Text style={styles.scoreLabel}>昨夜のスコア</Text>
                <View style={styles.scoreRow}>
                    <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}</Text>
                    <Text style={styles.scoreUnit}>/ 100</Text>
                </View>
            </View>

            {/* 気分選択 */}
            <Text style={styles.moodQuestion}>今朝の気分はどうですか？</Text>
            <View style={styles.moodRow}>
                {MOOD_OPTIONS.map(option => {
                    const isSelected = selected === option.value;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.moodButton,
                                isSelected && styles.moodButtonSelected,
                            ]}
                            onPress={() => handleSelect(option.value)}
                            disabled={selected !== null}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.moodEmoji,
                                    isSelected && styles.moodEmojiSelected,
                                ]}
                            >
                                {option.emoji}
                            </Text>
                            <Text
                                style={[
                                    styles.moodLabel,
                                    isSelected && styles.moodLabelSelected,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* 選択後メッセージ */}
            {selected !== null && (
                <Text style={styles.thanksText}>
                    ありがとう！記録しました ✨
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    sunEmoji: {
        fontSize: 36,
    },
    title: {
        fontSize: 23,
        fontWeight: '700',
        color: COLORS.text.dark,
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
        marginTop: 2,
    },
    // スコア
    scoreSection: {
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 12,
    },
    scoreLabel: {
        fontSize: 16,
        color: '#94A3B8',
        marginBottom: 4,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    scoreValue: {
        fontSize: 52,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    scoreUnit: {
        fontSize: 21,
        color: '#64748B',
        marginLeft: 4,
    },
    // 気分選択
    moodQuestion: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.dark,
        textAlign: 'center',
        marginBottom: 12,
    },
    moodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    moodButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    moodButtonSelected: {
        backgroundColor: COLORS.primary,
        transform: [{ scale: 1.05 }],
    },
    moodEmoji: {
        fontSize: 31,
        marginBottom: 4,
    },
    moodEmojiSelected: {
        fontSize: 36,
    },
    moodLabel: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
    moodLabelSelected: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    thanksText: {
        textAlign: 'center',
        fontSize: 17,
        color: COLORS.success,
        fontWeight: '600',
        marginTop: 12,
    },
});
