import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChromeHeaderMetrics, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

const Z_INDEX_STYLE = { zIndex: 2 };

export const TransactionInfoNavBand = () => {
    const height = useScreenChromeHeaderMetrics();
    const scrollY = useScreenChromeScrollY();
    const backgroundStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [0, 10], [0, 1], Extrapolation.CLAMP)
    }));
    const bandStyle = [Z_INDEX_STYLE, { height }, backgroundStyle];

    return (
        <Animated.View className="absolute inset-x-0 top-0 bg-grouped-surface" style={bandStyle} pointerEvents="none">
            <Animated.View className="absolute inset-x-0 bottom-0 h-hairline bg-surface-separator" />
        </Animated.View>
    );
};
