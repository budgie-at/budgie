import { useState } from 'react';
import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly collapse?: boolean;
    readonly onLayout?: (event: LayoutChangeEvent) => void;
    readonly className?: string;
}

export const TransactionInfoHeroFade = ({ children, collapse = false, onLayout, className }: Props) => {
    const scrollY = useScreenChromeScrollY();
    const reducedMotion = useReducedMotion();
    const [top, setTop] = useState(Number.MAX_SAFE_INTEGER);
    const [height, setHeight] = useState(0);
    const handleLayout = (event: LayoutChangeEvent) => {
        setTop(event.nativeEvent.layout.y);
        onLayout?.(event);
    };
    const handleContentLayout = (event: LayoutChangeEvent) => void setHeight(event.nativeEvent.layout.height);
    const heroStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.get(), [top - (collapse ? 24 : 16), top], [1, 0], Extrapolation.CLAMP);

        return {
            opacity,
            ...(collapse && { height: height * (reducedMotion ? Number(opacity > 0) : opacity) })
        };
    });

    return (
        <Animated.View onLayout={handleLayout} className={className} style={heroStyle}>
            <View onLayout={handleContentLayout}>{children}</View>
        </Animated.View>
    );
};
