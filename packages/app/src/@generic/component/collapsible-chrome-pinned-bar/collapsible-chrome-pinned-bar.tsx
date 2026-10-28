import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { SCREEN_CHROME_HEADER_LAYOUT_METRICS, getScreenChromeHeaderMetrics } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly anchorY: number;
    readonly onHeightChange: (height: number) => void;
    readonly children: ReactNode;
}

export const CollapsibleChromePinnedBar = ({ anchorY, onHeightChange, children }: Props) => {
    const { scrollY } = useCollapsibleHeaderScroll();
    const { top } = useSafeAreaInsets();

    const restingTop = top + SCREEN_CHROME_CONTENT_INSET_TOP + anchorY;
    const pinnedTop = getScreenChromeHeaderMetrics(SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize, top);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: Math.max(restingTop - scrollY.value, pinnedTop) }]
    }));

    const handleLayout = (event: LayoutChangeEvent) => void onHeightChange(event.nativeEvent.layout.height);

    return (
        <Animated.View
            className="absolute inset-x-0 top-0 bg-primary-reverse px-5xl pt-xl pb-sm"
            style={animatedStyle}
            onLayout={handleLayout}
        >
            {children}
        </Animated.View>
    );
};
