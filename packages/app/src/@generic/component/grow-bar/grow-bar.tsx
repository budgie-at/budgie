import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useGrowProgress } from '../../hook/use-grow-progress.hook';

interface Props {
    readonly ratio: number;
    readonly className: string;
    readonly staggerIndex?: number;
}

const PERCENT_MULTIPLIER = 100;

export const GrowBar = ({ ratio, className, staggerIndex = 0 }: Props) => {
    const progress = useGrowProgress(ratio, staggerIndex);
    const scaleDivisor = Math.max(ratio, Number.MIN_VALUE);
    const width: `${number}%` = `${ratio * PERCENT_MULTIPLIER}%`;
    const sizeStyle = { width, transformOrigin: 'left' };
    const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() / scaleDivisor }] }));

    const fillStyle = [sizeStyle, scaleStyle];

    return <Animated.View className={className} style={fillStyle} />;
};
