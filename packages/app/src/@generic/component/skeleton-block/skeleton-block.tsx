import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly className?: string;
}

const PULSE_MIN = 0.3;
const PULSE_MAX = 0.7;
const PULSE_DURATION = 800;

export const SkeletonBlock = ({ className }: Props) => {
    const opacity = useSharedValue(PULSE_MIN);

    useEffect(() => {
        opacity.set(withRepeat(withTiming(PULSE_MAX, { duration: PULSE_DURATION }), -1, true));
    }, [opacity]);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return <Animated.View className={cn('bg-secondary-corner rounded-md', className)} style={animatedStyle} />;
};
