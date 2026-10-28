import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { GROW_BAR_SPRING, GROW_BAR_STAGGER } from '../../constant/grow-bar-motion.constant';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly ratio: number;
    readonly className: string;
    readonly staggerIndex?: number;
    readonly children?: ReactNode;
}

const PERCENT_MULTIPLIER = 100;

export const GrowBar = ({ ratio, className, staggerIndex = 0, children }: Props) => {
    const reducedMotion = useReducedMotion();
    const progress = useSharedValue(0);
    const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * PERCENT_MULTIPLIER}%` }));

    useEffect(() => {
        progress.set(reducedMotion ? ratio : withDelay(staggerIndex * GROW_BAR_STAGGER, withSpring(ratio, GROW_BAR_SPRING)));
    }, [progress, ratio, reducedMotion, staggerIndex]);

    return (
        <Animated.View className={className} style={fillStyle}>
            {children}
        </Animated.View>
    );
};
