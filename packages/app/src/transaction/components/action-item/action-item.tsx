import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { EASE_OUT, MOTION_FAST_DURATION, SPRING_SETTLE } from '../../../@generic/constant/motion.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly totalItems: number;
    readonly isOpen: boolean;
    readonly children: ReactNode;
}

const ITEM_SPACING = 72;
const HIDDEN_SCALE = 0.9;
const OPEN_OFFSET = 24;
const OPEN_STAGGER = 35;
const OPEN_OPACITY_DURATION = 150;

export const ActionItem = ({ index, totalItems, isOpen, children }: Props) => {
    const translateY = useSharedValue(OPEN_OFFSET);
    const scale = useSharedValue(HIDDEN_SCALE);
    const opacity = useSharedValue(0);

    const reverseIndex = totalItems - 1 - index;
    const targetY = -(ITEM_SPACING * (index + 1));

    useEffect(() => {
        if (isOpen) {
            const delay = Math.min(reverseIndex, 4) * OPEN_STAGGER;
            translateY.set(withDelay(delay, withSpring(0, SPRING_SETTLE)));
            scale.set(withDelay(delay, withSpring(1, SPRING_SETTLE)));
            opacity.set(withDelay(delay, withTiming(1, { duration: OPEN_OPACITY_DURATION, easing: EASE_OUT })));
        } else {
            translateY.set(withTiming(OPEN_OFFSET, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }));
            scale.set(withTiming(HIDDEN_SCALE, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }));
            opacity.set(withTiming(0, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }));
        }
    }, [isOpen, opacity, reverseIndex, scale, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: targetY + translateY.get() }, { scale: scale.get() }],
        opacity: opacity.get()
    }));

    return (
        <Animated.View className="absolute right-0" style={animatedStyle}>
            {children}
        </Animated.View>
    );
};
