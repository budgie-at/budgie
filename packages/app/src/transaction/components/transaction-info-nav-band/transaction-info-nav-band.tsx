import Animated from 'react-native-reanimated';

import { useScreenChromeHeaderMetrics, useScrollFadeStyle } from '@rnw-community/react-native-screen-chrome';

const HAIRLINE_SCROLL_RANGE = [12, 20] as const;
const HAIRLINE_OPACITY_RANGE = [0, 1] as const;
const Z_INDEX_STYLE = { zIndex: 2 };

export const TransactionInfoNavBand = () => {
    const height = useScreenChromeHeaderMetrics();
    const hairlineStyle = useScrollFadeStyle(HAIRLINE_SCROLL_RANGE, HAIRLINE_OPACITY_RANGE);
    const backgroundStyle = useScrollFadeStyle([0, 12], [0, 1]);
    const bandStyle = [Z_INDEX_STYLE, { height }, backgroundStyle];

    return (
        <Animated.View className="absolute inset-x-0 top-0 bg-surface" style={bandStyle} pointerEvents="none">
            <Animated.View className="absolute inset-x-0 bottom-0 h-hairline bg-surface-separator" style={hairlineStyle} />
        </Animated.View>
    );
};
