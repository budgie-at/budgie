import Animated, { Extrapolation, interpolate, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';

interface Props {
    readonly revealOffset: number;
    readonly children: ReactNode;
}

const HERO_COLLAPSED_SCALE = 0.96;

export const TransactionInfoHeroFade = ({ revealOffset, children }: Props) => {
    const scrollY = useScreenChromeScrollY();
    const reducedMotion = useReducedMotion();
    const heroStyle = useAnimatedStyle(() => {
        const progress = interpolate(scrollY.get(), [revealOffset, revealOffset + 32], [0, 1], Extrapolation.CLAMP);

        return {
            opacity: 1 - progress,
            transform: [{ scale: reducedMotion ? 1 : interpolate(progress, [0, 1], [1, HERO_COLLAPSED_SCALE]) }]
        };
    });

    return (
        <Animated.View className="items-center pt-3xl pb-7xl" style={heroStyle}>
            {children}
        </Animated.View>
    );
};
