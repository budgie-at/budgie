import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const CollapsibleChromeScrollFade = ({ children }: Props) => {
    const { scrollY } = useCollapsibleHeaderScroll();
    const contentHeight = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: contentHeight.value > 0 ? interpolate(scrollY.value, [0, contentHeight.value], [1, 0], Extrapolation.CLAMP) : 1
    }));

    const handleLayout = (event: LayoutChangeEvent) => void contentHeight.set(event.nativeEvent.layout.height);

    return (
        <Animated.View style={animatedStyle} onLayout={handleLayout}>
            {children}
        </Animated.View>
    );
};
