import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { useScreenChromeHeaderMetrics, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

const Z_INDEX_STYLE = { zIndex: 2 };

export const TransactionInfoNavBand = () => {
    const height = useScreenChromeHeaderMetrics();
    const scrollY = useScreenChromeScrollY();
    const { theme } = useUniwind();
    const backgroundStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [0, 10], [0, 1], Extrapolation.CLAMP)
    }));
    const bandStyle = [Z_INDEX_STYLE, { height }, backgroundStyle];
    const className = isLiquidGlassAvailable() ? 'absolute inset-x-0 top-0' : 'absolute inset-x-0 top-0 bg-grouped-surface/90';

    return (
        <Animated.View className={className} style={bandStyle} pointerEvents="none">
            <GlassView glassEffectStyle="regular" colorScheme={theme} style={StyleSheet.absoluteFill} />
            <Animated.View className="absolute inset-x-0 bottom-0 h-hairline bg-surface-separator" />
        </Animated.View>
    );
};
