import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import { TRANSACTION_INFO_ROW_MAX_FONT_SCALE } from '../../constant/transaction-info-row-max-font-scale.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly range: readonly [number, number];
    readonly className: string;
    readonly numberOfLines: number;
}

export const TransactionInfoCompactLine = ({ children, range, className, numberOfLines }: Props) => {
    const scrollY = useScreenChromeScrollY();
    const [start, end] = range;
    const revealStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [start, Math.max(end, start + 1)], [0, 1], Extrapolation.CLAMP)
    }));

    return (
        <Animated.Text
            maxFontSizeMultiplier={TRANSACTION_INFO_ROW_MAX_FONT_SCALE}
            className={`self-stretch text-center ${className}`}
            style={revealStyle}
            numberOfLines={numberOfLines}
            ellipsizeMode="tail"
        >
            {children}
        </Animated.Text>
    );
};
