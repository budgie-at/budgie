import { View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';

import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { SegmentedControlItem } from '../segmented-control-item/segmented-control-item';

import type { SegmentedControlSegmentInterface } from '../../interface/segmented-control-segment.interface';
import type { LayoutChangeEvent } from 'react-native';

interface Props<T extends string> {
    readonly segments: readonly SegmentedControlSegmentInterface<T>[];
    readonly value: T;
    readonly onChange: (value: T) => void;
}

const TRACK_PADDING = 2;
const THUMB_SPRING = { damping: 30, stiffness: 420, mass: 0.8 };
const continuousCorners = { borderCurve: 'continuous' as const };

export const SegmentedControl = <T extends string>({ segments, value, onChange }: Props<T>) => {
    const reducedMotion = useReducedMotion();
    const segmentWidth = useSharedValue(0);
    const activeIndex = Math.max(
        segments.findIndex(segment => segment.value === value),
        0
    );
    const thumbOffset = useDerivedValue(() => {
        const target = activeIndex * segmentWidth.get();

        return reducedMotion ? target : withSpring(target, THUMB_SPRING);
    });

    const thumbAnimatedStyle = useAnimatedStyle(() => ({ width: segmentWidth.get(), transform: [{ translateX: thumbOffset.get() }] }));

    const handleLayout = (event: LayoutChangeEvent) =>
        void segmentWidth.set((event.nativeEvent.layout.width - TRACK_PADDING * 2) / segments.length);

    const thumbStyle = [continuousCorners, thumbAnimatedStyle];

    return (
        <View
            accessibilityRole="tablist"
            className="min-h-[36px] flex-row rounded-[10px] bg-surface-fill p-[2px]"
            style={continuousCorners}
            onLayout={handleLayout}
        >
            <Animated.View
                className="absolute top-[2px] bottom-[2px] left-[2px] rounded-[8px] bg-white shadow-sm dark:bg-[rgb(99,99,102)]"
                style={thumbStyle}
            />

            {segments.map(segment => (
                <SegmentedControlItem key={segment.value} segment={segment} isActive={segment.value === value} onPress={onChange} />
            ))}
        </View>
    );
};
