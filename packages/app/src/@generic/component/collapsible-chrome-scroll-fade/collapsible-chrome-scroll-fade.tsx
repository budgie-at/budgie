import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';

import { SCREEN_CHROME_HERO_HANDOFF_DISTANCE } from '../../constant/screen-chrome-hero-handoff-distance.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const FADE_OUT_END_PROGRESS = 0.6;
const FADE_OUT_DISTANCE = SCREEN_CHROME_HERO_HANDOFF_DISTANCE * FADE_OUT_END_PROGRESS;

export const CollapsibleChromeScrollFade = ({ children }: Props) => {
    const { scrollY } = useCollapsibleHeaderScroll();

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [0, FADE_OUT_DISTANCE], [1, 0], Extrapolation.CLAMP)
    }));

    return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};
