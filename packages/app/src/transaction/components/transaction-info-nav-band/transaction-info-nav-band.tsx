import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChromeHeaderMetrics, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

const Z_INDEX_STYLE = { zIndex: 2 };

export const TransactionInfoNavBand = () => {
    const height = useScreenChromeHeaderMetrics();
    const scrollY = useScreenChromeScrollY();
    const visibilityStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.get(), [0, 1], [0, 1], Extrapolation.CLAMP) }));
    const bandStyle = [Z_INDEX_STYLE, { height }, visibilityStyle];

    return (
        <Animated.View
            className="absolute inset-x-0 top-0 bg-transaction-detail-bar border-b-hairline border-surface-separator"
            style={bandStyle}
            pointerEvents="none"
        >
            <View className="absolute inset-x-0 top-full h-[8px] bg-linear-to-b from-surface to-transparent" />
        </Animated.View>
    );
};
