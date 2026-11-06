import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { FLOATING_TAB_BAR_HEIGHT } from '../../constant/floating-tab-bar.constant';
import { SCREEN_CHROME_TITLE_CLEARANCE } from '../../constant/screen-chrome-config.constant';

import type { EdgeFadeBandRenderPropsInterface } from '@rnw-community/react-native-screen-chrome';

type Props = Pick<EdgeFadeBandRenderPropsInterface, 'blur' | 'position' | 'height' | 'colorScheme'>;

export const ScreenChromeEdgeBand = ({ blur, position, height, colorScheme }: Props) => {
    const { config } = useScreenChrome();
    const gradientID = useId();
    const gradientFill = `url(#${gradientID})`;
    const { top, bottom } = useSafeAreaInsets();
    const protectedHeight =
        position === 'top'
            ? top + (config.collapsedHeaderHeight ?? config.headerHeight) + SCREEN_CHROME_TITLE_CLEARANCE
            : bottom + FLOATING_TAB_BAR_HEIGHT;
    const plateau = Math.min(1, protectedHeight / height);
    const gradientEnd = position === 'top' ? 1 : 0;
    const gradientStart = position === 'top' ? 0 : 1;
    const { solid } = config.colors[colorScheme];

    return (
        <View style={StyleSheet.absoluteFill}>
            {blur}
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                    <LinearGradient id={gradientID} x1="0" y1={gradientStart} x2="0" y2={gradientEnd}>
                        <Stop offset="0" stopColor={solid} />
                        <Stop offset={plateau} stopColor={solid} />
                        <Stop offset="1" stopColor={solid} stopOpacity={0} />
                    </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill={gradientFill} />
            </Svg>
        </View>
    );
};
