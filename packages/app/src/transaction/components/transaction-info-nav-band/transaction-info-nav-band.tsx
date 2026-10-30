import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { EdgeFade, useScreenChrome, useScreenChromeHeaderMetrics, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import type { EdgeFadeBandRenderer } from '@rnw-community/react-native-screen-chrome';

const Z_INDEX_STYLE = { zIndex: 2 };

export const TransactionInfoNavBand = () => {
    const height = useScreenChromeHeaderMetrics();
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const backgroundStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.get(), [0, 1], [0, 1], Extrapolation.CLAMP) }));
    const bandStyle = [Z_INDEX_STYLE, { height }, backgroundStyle];
    const scrollEdgeStyle = { top: height };
    const renderBlur: EdgeFadeBandRenderer = ({ blur, defaultBand }) => (isLiquidGlassAvailable() ? blur : defaultBand);

    return (
        <Animated.View className="absolute inset-x-0 top-0 bg-grouped-surface" style={bandStyle} pointerEvents="none">
            <EdgeFade position="top" height={config.headerHeight} renderBand={renderBlur} />
            <View
                className="absolute inset-x-0 h-[16px] bg-linear-to-b from-grouped-surface via-grouped-surface/40 to-transparent"
                style={scrollEdgeStyle}
            />
        </Animated.View>
    );
};
