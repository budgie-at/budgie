import { useRef } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';

import { SCREEN_CHROME_HEADER_BAND_HEIGHT } from '../../constant/screen-chrome-header-band-height.constant';

import type { ReactNode } from 'react';
import type { View } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

const FADE_OUT_DISTANCE = 16;
const MIN_FADE_END = 1;

export const CollapsibleChromeScrollFade = ({ children }: Props) => {
    const ref = useRef<View>(null);
    const fadeEnd = useSharedValue(Number.MAX_SAFE_INTEGER);

    const { scrollY } = useCollapsibleHeaderScroll();
    const { top } = useSafeAreaInsets();

    const handleLayout = () => {
        ref.current?.measureInWindow((_x, y) => {
            fadeEnd.set(Math.max(y + scrollY.get() - top - SCREEN_CHROME_HEADER_BAND_HEIGHT, MIN_FADE_END));
        });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [Math.max(fadeEnd.get() - FADE_OUT_DISTANCE, 0), fadeEnd.get()], [1, 0], Extrapolation.CLAMP)
    }));

    return (
        <Animated.View ref={ref} className="self-stretch" style={animatedStyle} onLayout={handleLayout} collapsable={false}>
            {children}
        </Animated.View>
    );
};
