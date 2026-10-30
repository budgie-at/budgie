import { useState } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import { TRANSACTION_INFO_HANDOFF_DISTANCE } from '../../constant/transaction-info-handoff-distance.constant';

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
    const handleLayout = (event: LayoutChangeEvent) => {
        setTop(event.nativeEvent.layout.y);
        onLayout?.(event);
    };
    const heroStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.get(),
            [top - TRANSACTION_INFO_HANDOFF_DISTANCE, top + TRANSACTION_INFO_HANDOFF_DISTANCE],
            [1, 0],
            Extrapolation.CLAMP
        )
    }));

    return (
        <Animated.View onLayout={handleLayout} className={className} style={heroStyle}>
            {children}
        </Animated.View>
    );
};
