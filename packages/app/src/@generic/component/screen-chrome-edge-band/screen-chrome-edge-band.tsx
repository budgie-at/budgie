import { use } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomChromeInset, useScreenChrome, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_EDGE_RAMP_LENGTH, SCREEN_CHROME_TITLE_CLEARANCE } from '../../constant/screen-chrome-config.constant';
import { ScreenChromeStickyHeadersContext } from '../../context/screen-chrome-sticky-headers.context';
import { ScreenChromeEdgeGradient } from '../screen-chrome-edge-gradient/screen-chrome-edge-gradient';

import type { EdgeFadeBandRenderPropsInterface } from '@rnw-community/react-native-screen-chrome';

type Props = Pick<EdgeFadeBandRenderPropsInterface, 'blur' | 'position' | 'height' | 'colorScheme'>;

export const ScreenChromeEdgeBand = ({ blur, position, height, colorScheme }: Props) => {
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const { chromeHeight, inset } = useBottomChromeInset();
    const { top, bottom } = useSafeAreaInsets();
    const bandHeight = position === 'bottom' && chromeHeight > 0 && height > bottom ? inset + SCREEN_CHROME_EDGE_RAMP_LENGTH : height;
    const protectedHeight =
        position === 'top'
            ? top + (config.collapsedHeaderHeight ?? config.headerHeight) + SCREEN_CHROME_TITLE_CLEARANCE
            : Math.max(0, bandHeight - SCREEN_CHROME_EDGE_RAMP_LENGTH);
    const plateau = Math.min(1, protectedHeight / Math.max(1, bandHeight));
    const { solid } = config.colors[colorScheme];
    const { anchor, state: stickyState } = use(ScreenChromeStickyHeadersContext) ?? {};
    const offsetStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY:
                    position === 'top'
                        ? Math.max(0, (anchor?.get() ?? protectedHeight) - protectedHeight) + (stickyState?.get().height ?? 0)
                        : 0
            }
        ]
    }));
    const fillStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height:
            position === 'top' ? Math.max(0, (anchor?.get() ?? protectedHeight) - protectedHeight) + (stickyState?.get().height ?? 0) : 0,
        backgroundColor: solid
    }));
    const containerStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: 0,
        right: 0,
        [position]: 0,
        height: bandHeight,
        opacity: position === 'top' ? Math.min(1, Math.max(0, scrollY.get()) / SCREEN_CHROME_EDGE_RAMP_LENGTH) : 1
    }));

    const bandStyle = [StyleSheet.absoluteFill, offsetStyle];

    return (
        <Animated.View style={containerStyle}>
            <Animated.View style={fillStyle} />
            <Animated.View style={bandStyle}>
                <ScreenChromeEdgeGradient position={position} height={bandHeight} plateau={plateau} solid={solid} blur={blur} />
            </Animated.View>
        </Animated.View>
    );
};
