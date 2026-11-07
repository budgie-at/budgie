import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useGrowProgress } from '../../hook/use-grow-progress.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly ratio: number;
    readonly className: string;
    readonly staggerIndex?: number;
    readonly children?: ReactNode;
}

const PERCENT_MULTIPLIER = 100;

export const GrowBar = ({ ratio, className, staggerIndex = 0, children }: Props) => {
    const progress = useGrowProgress(ratio, staggerIndex);
    const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * PERCENT_MULTIPLIER}%` }));

    return (
        <Animated.View className={className} style={fillStyle}>
            {children}
        </Animated.View>
    );
};
