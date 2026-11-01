import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import {
    EdgeFade,
    SCREEN_CHROME_HEADER_LAYOUT_METRICS,
    useScreenChrome,
    useScreenChromeScrollY
} from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';

const SCRIM_Z_INDEX = 2;
const SCRIM_FADE_HEIGHT = 24;
const HIDDEN_OPACITY = 0;
const VISIBLE_OPACITY = 1;

export const CollapsibleChromeHeaderScrim = (): ReactNode => {
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const spacerStyle = {
        height: Math.max(config.collapsedHeaderHeight ?? config.headerHeight, SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize)
    };

    const animatedStyle = useAnimatedStyle(() => ({
        zIndex: SCRIM_Z_INDEX,
        opacity: interpolate(
            scrollY.get(),
            [config.collapseStart, config.collapseEnd],
            [HIDDEN_OPACITY, VISIBLE_OPACITY],
            Extrapolation.CLAMP
        )
    }));

    return (
        <Animated.View
            pointerEvents="none"
            className="absolute inset-x-0 top-0 border-b-hairline border-surface-separator bg-primary-reverse pt-safe"
            style={animatedStyle}
        >
            <View style={spacerStyle} />
            <View className="absolute inset-x-0 top-full h-[24px]" pointerEvents="none">
                <EdgeFade position="top" height={SCRIM_FADE_HEIGHT} />
            </View>
        </Animated.View>
    );
};
