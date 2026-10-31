import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly totalItems: number;
    readonly isOpen: boolean;
    readonly children: ReactNode;
}

const ITEM_SPACING = 72;
const STAGGER_DELAY = 40;
const SPRING_CONFIG = { damping: 12, stiffness: 180, mass: 0.6 };

export const ActionItem = ({ index, totalItems, isOpen, children }: Props) => {
    const translateY = useSharedValue(0);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    const reverseIndex = totalItems - 1 - index;
    const targetY = -(ITEM_SPACING * (index + 1));

    useEffect(() => {
        if (isOpen) {
            const delay = reverseIndex * STAGGER_DELAY;
            translateY.set(withDelay(delay, withSpring(targetY, SPRING_CONFIG)));
            scale.set(withDelay(delay, withSpring(1, SPRING_CONFIG)));
            opacity.set(withDelay(delay, withSpring(1, SPRING_CONFIG)));
        } else {
            const delay = index * STAGGER_DELAY;
            translateY.set(withDelay(delay, withSpring(0, SPRING_CONFIG)));
            scale.set(withDelay(delay, withSpring(0, SPRING_CONFIG)));
            opacity.set(withDelay(delay, withSpring(0, SPRING_CONFIG)));
        }
    }, [index, isOpen, opacity, reverseIndex, scale, targetY, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }, { scale: scale.value }],
        opacity: opacity.value
    }));

    return (
        <Animated.View className="absolute right-0" style={animatedStyle}>
            {children}
        </Animated.View>
    );
};
