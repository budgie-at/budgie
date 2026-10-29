import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const FADE_OUT_DISTANCE = 24;

export const CollapsibleChromeScrollFade = ({ children }: Props) => {
    const { scrollY } = useCollapsibleHeaderScroll();

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, FADE_OUT_DISTANCE], [1, 0], Extrapolation.CLAMP)
    }));

    return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};
