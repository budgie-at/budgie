import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import type { TransactionInfoHandoffInterface } from '../../interface/transaction-info-handoff.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly handoff: TransactionInfoHandoffInterface;
    readonly className: string;
}

export const TransactionInfoHeroTravel = ({ children, handoff, className }: Props) => {
    const scrollY = useScreenChromeScrollY();
    const [, handoffEnd] = handoff.amountFadeRange;
    const { heroTravel } = handoff;
    const travelStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(scrollY.get(), [0, handoffEnd], [0, heroTravel], Extrapolation.CLAMP) }]
    }));

    return (
        <Animated.View className={className} style={travelStyle}>
            {children}
        </Animated.View>
    );
};
