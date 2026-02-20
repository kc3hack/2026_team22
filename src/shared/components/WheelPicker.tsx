import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { COLORS } from '@shared/constants';

interface WheelPickerProps {
    items: Array<{ label: string; value: number }>;
    selectedValue: number;
    onValueChange: (value: number) => void;
    itemHeight?: number;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({
    items,
    selectedValue,
    onValueChange,
    itemHeight = 50,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [isLayoutReady, setLayoutReady] = useState(false);
    const isScrollingInternal = useRef(false);
    const [currentIndex, setCurrentIndex] = useState(() =>
        Math.max(
            0,
            items.findIndex(i => i.value === selectedValue)
        )
    );

    const paddedItems = [
        { label: '', value: -1, isPadding: true },
        { label: '', value: -2, isPadding: true },
        ...items.map(item => ({ ...item, isPadding: false })),
        { label: '', value: -3, isPadding: true },
        { label: '', value: -4, isPadding: true },
    ];

    useEffect(() => {
        if (isLayoutReady && !isScrollingInternal.current) {
            const index = items.findIndex(i => i.value === selectedValue);
            if (index >= 0) {
                scrollViewRef.current?.scrollTo({ y: index * itemHeight, animated: true });
                setCurrentIndex(index);
            }
        }
    }, [selectedValue, items, itemHeight, isLayoutReady]);

    const snapAndChangeValue = (y: number) => {
        let index = Math.round(y / itemHeight);
        index = Math.max(0, Math.min(index, items.length - 1));
        const targetValue = items[index].value;
        if (targetValue !== selectedValue) {
            onValueChange(targetValue);
        }
    };

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        let index = Math.round(y / itemHeight);
        index = Math.max(0, Math.min(index, items.length - 1));
        if (index !== currentIndex) {
            setCurrentIndex(index);
        }
    };

    const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        isScrollingInternal.current = false;
        snapAndChangeValue(e.nativeEvent.contentOffset.y);
    };

    const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        // If there's no momentum, ScrollView stops without triggering momentum end.
        if (!e.nativeEvent.velocity?.y || Math.abs(e.nativeEvent.velocity.y) < 0.2) {
            setTimeout(() => {
                isScrollingInternal.current = false;
                // Check current offset via ref or e? e.nativeEvent.contentOffset is from drag end,
                // it may snap later. But snapToInterval handles it.
                // The safest fallback is let onScroll do it if needed, or update via snap
            }, 100);
        }
    };

    const onScrollBeginDrag = () => {
        isScrollingInternal.current = true;
    };

    return (
        <View style={[styles.container, { height: itemHeight * 5 }]} onLayout={() => setLayoutReady(true)}>
            <View
                style={[styles.indicator, { height: itemHeight, top: itemHeight * 2 }]}
                pointerEvents="none"
            />
            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={itemHeight}
                decelerationRate="fast"
                onScroll={handleScroll}
                onScrollBeginDrag={onScrollBeginDrag}
                onMomentumScrollEnd={onMomentumScrollEnd}
                onScrollEndDrag={onScrollEndDrag}
                scrollEventThrottle={16}
                bounces={false}
            >
                {paddedItems.map((item, idx) => {
                    const isSelected = !item.isPadding && idx - 2 === currentIndex;
                    return (
                        <View
                            key={`${item.value}-${idx}`}
                            style={[styles.itemContainer, { height: itemHeight }]}
                        >
                            {!item.isPadding && (
                                <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                                    {item.label}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    indicator: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#334155',
    },
    itemContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 22,
        color: '#64748B',
    },
    itemTextSelected: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.text.dark,
    },
});
