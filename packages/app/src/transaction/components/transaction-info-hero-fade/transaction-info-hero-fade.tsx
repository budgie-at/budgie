import { useState } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly onLayout?: (event: LayoutChangeEvent) => void;
    readonly className?: string;
}

export const TransactionInfoHeroFade = ({ children, onLayout, className }: Props) => {
    const scrollY = useScreenChromeScrollY();
    const [top, setTop] = useState(Number.MAX_SAFE_INTEGER);
    const [bottom, setBottom] = useState(Number.MAX_SAFE_INTEGER);
    const handleLayout = (event: LayoutChangeEvent) => {
        setTop(event.nativeEvent.layout.y);
        setBottom(event.nativeEvent.layout.y + Math.max(event.nativeEvent.layout.height, 1));
        onLayout?.(event);
    };
    const heroStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [top, bottom], [1, 0], Extrapolation.CLAMP)
    }));

    return (
        <Animated.View onLayout={handleLayout} className={className} style={heroStyle}>
            {children}
        </Animated.View>
    );
};
