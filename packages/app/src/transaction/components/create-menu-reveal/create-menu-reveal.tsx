import Animated, { Extrapolation, interpolate, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly progress: SharedValue<number>;
    readonly order: number;
    readonly className?: string;
    readonly children: ReactNode;
}

const STAGGER = 0.08;
const SPAN = 0.7;
const OPEN_OFFSET = 16;
const HIDDEN_SCALE = 0.96;

export const CreateMenuReveal = ({ progress, order, className, children }: Props) => {
    const isReducedMotion = useReducedMotion();
    const start = order * STAGGER;

    const animatedStyle = useAnimatedStyle(() => {
        const value = interpolate(progress.get(), [start, start + SPAN], [0, 1], Extrapolation.CLAMP);

        if (isReducedMotion) {
            return { opacity: value, transform: [{ translateY: 0 }, { scale: 1 }] };
        }

        return {
            opacity: value,
            transform: [{ translateY: (1 - value) * OPEN_OFFSET }, { scale: HIDDEN_SCALE + (1 - HIDDEN_SCALE) * value }]
        };
    });

    return (
        <Animated.View className={className} style={animatedStyle} pointerEvents="box-none">
            {children}
        </Animated.View>
    );
};
