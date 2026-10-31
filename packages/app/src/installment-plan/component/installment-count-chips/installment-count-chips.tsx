import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { InstallmentCountChip } from '../installment-count-chip/installment-count-chip';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly selectedCount: number | null;
    readonly minimumCount: number;
    readonly onSelect: (count: number) => void;
}

const INSTALLMENT_COUNT_OPTIONS = [3, 6, 12, 24] as const;
const THUMB_SPRING = { duration: 300, dampingRatio: 1 };
const THUMB_FADE = { duration: 150 };

export const InstallmentCountChips = ({ selectedCount, minimumCount, onSelect }: Props) => {
    const { t } = useLingui();
    const reducedMotion = useReducedMotion();
    const isKeyboardVisible = useKeyboardState(state => state.isVisible);
    const isImmediate = reducedMotion || isKeyboardVisible;

    const selectedIndex = INSTALLMENT_COUNT_OPTIONS.findIndex(option => option === selectedCount);
    const isPreset = selectedIndex >= 0;

    const segmentWidth = useSharedValue(0);
    const thumbIndex = useSharedValue(Math.max(selectedIndex, 0));
    const thumbOpacity = useSharedValue(Number(isPreset));

    const handleLayout = (event: LayoutChangeEvent) => {
        segmentWidth.set(event.nativeEvent.layout.width / INSTALLMENT_COUNT_OPTIONS.length);
    };

    const thumbStyle = useAnimatedStyle(() => ({
        width: segmentWidth.get(),
        opacity: thumbOpacity.get(),
        transform: [{ translateX: thumbIndex.get() * segmentWidth.get() }]
    }));

    useEffect(() => {
        if (!isPreset) {
            thumbOpacity.set(isImmediate ? 0 : withTiming(0, THUMB_FADE));

            return;
        }

        const isAppearing = thumbOpacity.get() < 1;

        thumbIndex.set(isImmediate || isAppearing ? selectedIndex : withSpring(selectedIndex, THUMB_SPRING));
        thumbOpacity.set(isImmediate ? 1 : withTiming(1, THUMB_FADE));
    }, [isPreset, selectedIndex, isImmediate, thumbIndex, thumbOpacity]);

    return (
        <View className="rounded-full bg-surface-fill/50 p-xxs">
            <View className="flex-row" onLayout={handleLayout} accessibilityRole="radiogroup" accessibilityLabel={t`Quick picks`}>
                <Animated.View
                    className="absolute top-0 bottom-0 left-0 rounded-full border border-ghost-corner bg-primary-reverse shadow-md dark:border-transparent dark:bg-surface-separator"
                    style={thumbStyle}
                />
                {INSTALLMENT_COUNT_OPTIONS.map(count => (
                    <InstallmentCountChip
                        key={count}
                        count={count}
                        isSelected={count === selectedCount}
                        minimumCount={minimumCount}
                        onSelect={onSelect}
                    />
                ))}
            </View>
        </View>
    );
};
