import { View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { cn } from '../../utils/cn.util';
import { SegmentedControlItem } from '../segmented-control-item/segmented-control-item';

import type { SegmentedControlSegmentInterface } from '../../interface/segmented-control-segment.interface';
import type { LayoutChangeEvent } from 'react-native';

interface Props<T extends string> {
    readonly segments: readonly SegmentedControlSegmentInterface<T>[];
    readonly value: T;
    readonly onChange: (value: T) => void;
    readonly disabled?: boolean;
    readonly className?: string;
    readonly maxFontSizeMultiplier?: number;
}

const TRACK_PADDING = 2;
const THUMB_SPRING = { damping: 30, stiffness: 420, mass: 0.8 };
const continuousCorners = { borderCurve: 'continuous' as const };

export const SegmentedControl = <T extends string>(props: Props<T>) => {
    const { segments, value, onChange, disabled = false, className, maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER } = props;
    const reducedMotion = useReducedMotion();
    const segmentWidth = useSharedValue(0);
    const activeIndex = segments.findIndex(segment => segment.value === value);
    const thumbOffset = useDerivedValue(() => {
        const target = activeIndex * segmentWidth.get();

        return reducedMotion ? target : withSpring(target, THUMB_SPRING);
    });

    const thumbAnimatedStyle = useAnimatedStyle(() => ({ width: segmentWidth.get(), transform: [{ translateX: thumbOffset.get() }] }));

    const handleLayout = (event: LayoutChangeEvent) =>
        void segmentWidth.set((event.nativeEvent.layout.width - TRACK_PADDING * 2) / segments.length);

    const thumbStyle = [continuousCorners, thumbAnimatedStyle];
    const accessibilityState = { disabled };

    return (
        <View
            accessibilityRole="tablist"
            accessibilityState={accessibilityState}
            className={cn('min-h-[36px] flex-row rounded-[10px] bg-segmented-track p-[2px]', className)}
            style={continuousCorners}
            onLayout={handleLayout}
        >
            {disabled || activeIndex < 0 ? null : (
                <Animated.View
                    className="absolute top-[2px] bottom-[2px] left-[2px] rounded-[8px] border-[0.5px] border-black/[0.06] bg-white shadow-md dark:border-transparent dark:bg-white/20"
                    style={thumbStyle}
                />
            )}

            {segments.map(segment => (
                <SegmentedControlItem
                    key={segment.value}
                    segment={segment}
                    isActive={segment.value === value}
                    disabled={disabled}
                    onPress={onChange}
                    maxFontSizeMultiplier={maxFontSizeMultiplier}
                />
            ))}
        </View>
    );
};
