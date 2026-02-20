import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
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
 * ムーンアイコンのパルスアニメーション付き
 */
export const PlanStatus: React.FC<PlanStatusProps> = ({ isLoading, error, onRetry }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isLoading) {
            // パルスアニメーション
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ).start();
            // 回転アニメーション
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 8000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ).start();
        }
    }, [isLoading, pulseAnim, rotateAnim]);

    useEffect(() => {
        if (error) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        }
    }, [error, fadeAnim]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (isLoading) {
        return (
            <View style={styles.container}>
                {/* 背景装飾ドット */}
                <View style={styles.bgDecorations}>
                    {[...Array(6)].map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.starDot,
                                {
                                    top: `${15 + i * 12}%`,
                                    left: `${10 + (i % 3) * 30}%`,
                                    opacity: 0.2 + (i % 3) * 0.15,
                                    width: 3 + (i % 2) * 2,
                                    height: 3 + (i % 2) * 2,
                                },
                            ]}
                        />
                    ))}
                </View>

                <Animated.View
                    style={[
                        styles.moonContainer,
                        {
                            transform: [{ scale: pulseAnim }, { rotate: spin }],
                        },
                    ]}
                >
                    <View style={styles.moonGlow} />
                    <Text style={styles.moonIcon}>🌙</Text>
                </Animated.View>

                <Text style={styles.loadingTitle}>睡眠プランを分析中</Text>
                <View style={styles.loaderBarTrack}>
                    <Animated.View
                        style={[
                            styles.loaderBarFill,
                            { transform: [{ scaleX: pulseAnim }] },
                        ]}
                    />
                </View>
                <Text style={styles.loadingSubText}>
                    AIがあなたの予定と睡眠パターンを{'\n'}最適化しています…
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                <View style={styles.errorCard}>
                    <View style={styles.errorIconWrap}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                    </View>
                    <Text style={styles.errorTitle}>プランの取得に失敗しました</Text>
                    <Text style={styles.errorDetail}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
                        <Text style={styles.retryText}>🔄 再試行する</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 32,
    },
    bgDecorations: {
        ...StyleSheet.absoluteFillObject,
    },
    starDot: {
        position: 'absolute',
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    moonContainer: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    moonGlow: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
    },
    moonIcon: {
        fontSize: 56,
    },
    loadingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text.dark,
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    loaderBarTrack: {
        width: 160,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        marginBottom: 20,
        overflow: 'hidden',
    },
    loaderBarFill: {
        width: '60%',
        height: '100%',
        borderRadius: 2,
        backgroundColor: COLORS.primary,
    },
    loadingSubText: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
    },
    // Error
    errorCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        width: '100%',
        maxWidth: 340,
    },
    errorIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    errorIcon: {
        fontSize: 36,
    },
    errorTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#F87171',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorDetail: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingHorizontal: 28,
        paddingVertical: 14,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
});
