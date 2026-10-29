import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChrome, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';

const SCRIM_Z_INDEX = 2;
const HIDDEN_OPACITY = 0;
const VISIBLE_OPACITY = 1;

export const CollapsibleChromeHeaderScrim = (): ReactNode => {
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const collapsedHeaderHeight = config.collapsedHeaderHeight ?? config.headerHeight;

    const spacerStyle = { height: collapsedHeaderHeight };

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
            className="absolute inset-x-0 top-0 border-b-hairline border-secondary-corner bg-primary-reverse/95 pt-safe"
            style={animatedStyle}
        >
            <View style={spacerStyle} />
        </Animated.View>
    );
};
