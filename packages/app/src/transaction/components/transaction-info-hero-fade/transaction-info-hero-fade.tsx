import { useState } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChrome, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const TransactionInfoHeroFade = ({ children }: Props) => {
    const scrollY = useScreenChromeScrollY();
    const { config } = useScreenChrome();
    const [fadeEnd, setFadeEnd] = useState(Number.MAX_SAFE_INTEGER);
    const handleLayout = (event: LayoutChangeEvent) => void setFadeEnd(event.nativeEvent.layout.y);
    const fadeStart = Math.max(0, fadeEnd - config.headerHeight);
    const heroStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [fadeStart, fadeEnd], [1, 0], Extrapolation.CLAMP)
    }));

    return (
        <Animated.View onLayout={handleLayout} style={heroStyle}>
            {children}
        </Animated.View>
    );
};
