import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { SCREEN_CHROME_HEADER_LAYOUT_METRICS, getScreenChromeHeaderMetrics } from '@rnw-community/react-native-screen-chrome';

import { getCollapsibleChromePinDistance } from '../../utils/get-collapsible-chrome-pin-distance.util';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly anchorY: number;
    readonly onHeightChange: (height: number) => void;
    readonly pinnedFooter?: ReactNode;
    readonly children: ReactNode;
}

export const CollapsibleChromePinnedBar = ({ anchorY, onHeightChange, pinnedFooter, children }: Props) => {
    const [height, setHeight] = useState(0);

    const { scrollY } = useCollapsibleHeaderScroll();
    const { top } = useSafeAreaInsets();

    const pinnedTop = getScreenChromeHeaderMetrics(SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize, top);
    const pinDistance = getCollapsibleChromePinDistance(anchorY, top);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: pinnedTop + Math.max(pinDistance - scrollY.value, 0) }]
    }));
    const pinnedEdgeAnimatedStyle = useAnimatedStyle(() => ({
        opacity: scrollY.value >= pinDistance ? 1 : 0
    }));

    const handleLayout = (event: LayoutChangeEvent) => {
        setHeight(event.nativeEvent.layout.height);
        onHeightChange(event.nativeEvent.layout.height);
    };

    const pinnedEdgeStyle = [{ top: height }, pinnedEdgeAnimatedStyle];

    return (
        <Animated.View className="absolute inset-x-0 top-0 bg-surface px-5xl py-md" style={animatedStyle} onLayout={handleLayout}>
            {children}

            <Animated.View className="absolute inset-x-0" style={pinnedEdgeStyle} pointerEvents="none">
                <View className="overflow-hidden">{pinnedFooter}</View>
                <View className="h-[12px] bg-linear-to-b from-surface via-surface/90 to-surface/0" />
            </Animated.View>
        </Animated.View>
    );
};
