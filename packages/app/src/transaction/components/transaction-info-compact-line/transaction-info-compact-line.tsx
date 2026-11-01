import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import { TRANSACTION_INFO_COMPACT_MAX_FONT_SCALE } from '../../constant/transaction-info-compact-max-font-scale.constant';

import type { ReactNode } from 'react';
import type { DerivedValue } from 'react-native-reanimated';

interface Props {
    readonly children: ReactNode;
    readonly range: DerivedValue<readonly [number, number]>;
    readonly className: string;
}

export const TransactionInfoCompactLine = ({ children, range, className }: Props) => {
    const scrollY = useScreenChromeScrollY();
    const revealStyle = useAnimatedStyle(() => {
        const [start, end] = range.get();

        return { opacity: interpolate(scrollY.get(), [start, Math.max(end, start + 1)], [0, 1], Extrapolation.CLAMP) };
    });

    return (
        <Animated.Text
            maxFontSizeMultiplier={TRANSACTION_INFO_COMPACT_MAX_FONT_SCALE}
            className={`text-center text-primary font-semibold ${className}`}
            style={revealStyle}
            numberOfLines={1}
            ellipsizeMode="tail"
        >
            {children}
        </Animated.Text>
    );
};
