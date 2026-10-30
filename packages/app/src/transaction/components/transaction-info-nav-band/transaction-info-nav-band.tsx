import { View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChromeHeaderMetrics, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import { TRANSACTION_INFO_AMOUNT_MAX_FONT_SCALE } from '../../constant/transaction-info-amount-max-font-scale.constant';

const Z_INDEX_STYLE = { zIndex: 2 };
const FADE_HEIGHT = 20;

export const TransactionInfoNavBand = () => {
    const height = useScreenChromeHeaderMetrics();
    const scrollY = useScreenChromeScrollY();
    const { fontScale } = useWindowDimensions();
    const visibilityStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.get(), [0, 1], [0, 1], Extrapolation.CLAMP) }));
    const bandStyle = [Z_INDEX_STYLE, { height }, visibilityStyle];
    const fadeStyle = { height: FADE_HEIGHT * Math.min(fontScale, TRANSACTION_INFO_AMOUNT_MAX_FONT_SCALE) };

    return (
        <Animated.View
            className="absolute inset-x-0 top-0 bg-transaction-detail-bar border-b-[0.5px] border-transaction-detail-bar-separator"
            style={bandStyle}
            pointerEvents="none"
        >
            <View className="absolute inset-x-0 top-full bg-linear-to-b from-surface to-transparent" style={fadeStyle} />
        </Animated.View>
    );
};
