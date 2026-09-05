import { getDefined } from '@rnw-community/shared';

import type { EdgeFadePosition, ScreenChromeConfigInterface } from '@rnw-community/react-native-screen-chrome';
import type { ViewStyle } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

export const getEdgeFadeBandMetrics = (
    position: EdgeFadePosition,
    height: number | undefined,
    config: ScreenChromeConfigInterface,
    insets: EdgeInsets
): ViewStyle => {
    const resolvedHeight = getDefined(height, () => (position === 'top' ? config.topFadeHeight : config.bottomFadeHeight));
    const inset = position === 'top' ? insets.top : insets.bottom;

    return {
        height: resolvedHeight + inset,
        ...(position === 'top' ? { top: -inset } : { bottom: -inset })
    };
};
