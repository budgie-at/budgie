import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { EdgeFade, useScreenChrome, useScreenChromeHeaderMetrics, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import type { EdgeFadeBandRenderer } from '@rnw-community/react-native-screen-chrome';

const Z_INDEX_STYLE = { zIndex: 2 };

export const TransactionInfoNavBand = () => {
    const height = useScreenChromeHeaderMetrics();
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const surface = useCSSVariable('--color-grouped-surface');
    const backgroundStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.get(), [0, 10], [0, 1], Extrapolation.CLAMP) }));
    const bandStyle = [Z_INDEX_STYLE, { height }, backgroundStyle];
    const styles = StyleSheet.create({
        fade: {
            top: height,
            height: config.headerHeight,
            experimental_backgroundImage: `linear-gradient(180deg,${surface},transparent)`
        }
    });
    const fadeStyle = [Z_INDEX_STYLE, styles.fade, backgroundStyle];
    const renderBlur: EdgeFadeBandRenderer = ({ blur, defaultBand }) => (isLiquidGlassAvailable() ? blur : defaultBand);

    return (
        <>
            <Animated.View className="absolute inset-x-0" style={fadeStyle} pointerEvents="none" />
            <Animated.View className="absolute inset-x-0 top-0 bg-grouped-surface" style={bandStyle} pointerEvents="none">
                <EdgeFade position="top" height={config.headerHeight} renderBand={renderBlur} />
                <View className="absolute inset-x-0 bottom-0 h-[0.5px] bg-surface-separator" />
            </Animated.View>
        </>
    );
};
