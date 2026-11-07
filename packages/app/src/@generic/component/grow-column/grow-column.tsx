import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useGrowProgress } from '../../hook/use-grow-progress.hook';

interface Props {
    readonly ratio: number;
    readonly className: string;
    readonly staggerIndex?: number;
}

const PERCENT_MULTIPLIER = 100;

export const GrowColumn = ({ ratio, className, staggerIndex = 0 }: Props) => {
    const progress = useGrowProgress(ratio, staggerIndex);
    const fillStyle = useAnimatedStyle(() => ({ height: `${progress.get() * PERCENT_MULTIPLIER}%` }));

    return <Animated.View className={className} style={fillStyle} />;
};
