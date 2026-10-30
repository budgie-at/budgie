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
    const materialStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.get(), [0, 1], [0, 1], Extrapolation.CLAMP) }));
    const bandStyle = [Z_INDEX_STYLE, { height }, materialStyle];
    const renderMaterial: EdgeFadeBandRenderer = ({ blur }) => (
        <>
            {isLiquidGlassAvailable() ? blur : null}
            <View className="absolute inset-0 bg-transaction-detail-bar" />
        </>
    );

    return (
        <Animated.View className="absolute inset-x-0 top-0" style={bandStyle} pointerEvents="none">
            <EdgeFade position="top" height={config.headerHeight} renderBand={renderMaterial} />
            <View className="absolute inset-x-0 bottom-0 h-[0.5px] bg-surface-separator" />
        </Animated.View>
    );
};
