import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { SCREEN_CHROME_HEADER_LAYOUT_METRICS, getScreenChromeHeaderMetrics } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly anchorY: number;
    readonly stackedHeaderHeight: number;
    readonly onHeightChange: (height: number) => void;
    readonly children: ReactNode;
}

const EDGE_FADE_DISTANCE = 12;
const EDGE_FADE_HEIGHT = 8;

export const CollapsibleChromePinnedBar = ({ anchorY, stackedHeaderHeight, onHeightChange, children }: Props) => {
    const { scrollY } = useCollapsibleHeaderScroll();
    const { top } = useSafeAreaInsets();

    const restingTop = top + SCREEN_CHROME_CONTENT_INSET_TOP + anchorY;
    const pinnedTop = getScreenChromeHeaderMetrics(SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize, top);
    const pinScrollY = restingTop - pinnedTop;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: Math.max(restingTop - scrollY.value, pinnedTop) }]
    }));
    const edgeFadeAnimatedStyle = useAnimatedStyle(() => ({
        height: EDGE_FADE_HEIGHT,
        bottom: -stackedHeaderHeight - EDGE_FADE_HEIGHT,
        opacity: interpolate(scrollY.value, [pinScrollY - EDGE_FADE_DISTANCE, pinScrollY], [0, 1], Extrapolation.CLAMP)
    }));

    const handleLayout = (event: LayoutChangeEvent) => void onHeightChange(event.nativeEvent.layout.height);

    return (
        <Animated.View className="absolute inset-x-0 top-0 bg-surface px-5xl py-md" style={animatedStyle} onLayout={handleLayout}>
            {children}

            <Animated.View
                className="absolute inset-x-0 bg-linear-to-b from-surface to-transparent"
                style={edgeFadeAnimatedStyle}
                pointerEvents="none"
            />
        </Animated.View>
    );
};
