import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { MIN_SCALE_DIVISOR, PERCENT_MULTIPLIER } from '../../constant/grow.constant';
import { useGrowProgress } from '../../hook/use-grow-progress.hook';

interface Props {
    readonly ratio: number;
    readonly className: string;
    readonly staggerIndex?: number;
}

export const GrowBar = ({ ratio, className, staggerIndex = 0 }: Props) => {
    const progress = useGrowProgress(ratio, staggerIndex);
    const scaleDivisor = Math.max(ratio, MIN_SCALE_DIVISOR);
    const width: `${number}%` = `${ratio * PERCENT_MULTIPLIER}%`;
    const sizeStyle = { width, transformOrigin: 'left' };
    const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() / scaleDivisor }] }));

    const fillStyle = [sizeStyle, scaleStyle];

    return <Animated.View className={className} style={fillStyle} />;
};
