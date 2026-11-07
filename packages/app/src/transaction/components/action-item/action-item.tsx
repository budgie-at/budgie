import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { ENTRANCE_DISTANCE, ENTRANCE_STAGGER } from '../../../@generic/constant/entrance-motion.constant';
import { EASE_OUT, MOTION_BASE_DURATION, MOTION_FAST_DURATION, SPRING_SETTLE } from '../../../@generic/constant/motion.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly totalItems: number;
    readonly isOpen: boolean;
    readonly children: ReactNode;
}

const ITEM_SPACING = 72;
const HIDDEN_SCALE = 0.95;
const OPEN_OFFSET = ENTRANCE_DISTANCE * 2;

export const ActionItem = ({ index, totalItems, isOpen, children }: Props) => {
    const translateY = useSharedValue(OPEN_OFFSET);
    const scale = useSharedValue(HIDDEN_SCALE);
    const opacity = useSharedValue(0);

    const reverseIndex = totalItems - 1 - index;
    const targetY = -(ITEM_SPACING * (index + 1));

    useEffect(() => {
        if (isOpen) {
            const delay = reverseIndex * ENTRANCE_STAGGER;
            translateY.set(withDelay(delay, withSpring(0, SPRING_SETTLE)));
            scale.set(withDelay(delay, withSpring(1, SPRING_SETTLE)));
            opacity.set(withDelay(delay, withTiming(1, { duration: MOTION_BASE_DURATION, easing: EASE_OUT })));
        } else {
            translateY.set(withTiming(OPEN_OFFSET, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }));
            scale.set(withTiming(HIDDEN_SCALE, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }));
            opacity.set(withTiming(0, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }));
        }
    }, [isOpen, opacity, reverseIndex, scale, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: targetY + translateY.value }, { scale: scale.value }],
        opacity: opacity.value
    }));

    return (
        <Animated.View className="absolute right-0" style={animatedStyle}>
            {children}
        </Animated.View>
    );
};
