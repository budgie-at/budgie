import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly range: readonly [number, number];
    readonly onLayout?: (event: LayoutChangeEvent) => void;
    readonly className?: string;
}

export const TransactionInfoHeroFade = ({ children, range, onLayout, className }: Props) => {
    const scrollY = useScreenChromeScrollY();
    const [start, end] = range;
    const fadeStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [start, Math.max(end, start + 1)], [1, 0], Extrapolation.CLAMP)
    }));

    return (
        <Animated.View onLayout={onLayout} className={className} style={fadeStyle}>
            {children}
        </Animated.View>
    );
};
