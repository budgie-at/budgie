import { ClassValue } from 'cn';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EASE_IN_OUT } from '../../constant/motion.constant';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { cn } from '../../utils/cn.util';

interface Props {
    readonly percentage: number;
    readonly className?: string;
    readonly fillClassName?: ClassValue;
}

const FILL_DURATION = 280;

export const ProgressTrack = ({ percentage, className, fillClassName = 'bg-primary' }: Props) => {
    const reducedMotion = useReducedMotion();
    const width = useSharedValue(percentage);

    useEffect(() => {
        width.set(reducedMotion ? percentage : withTiming(percentage, { duration: FILL_DURATION, easing: EASE_IN_OUT }));
    }, [percentage, reducedMotion, width]);

    const fillStyle = useAnimatedStyle(() => ({ width: `${width.get()}%` }));

    return (
        <View className={cn('overflow-hidden rounded-full bg-secondary-background', className)}>
            <Animated.View className={cn('h-full rounded-full', fillClassName)} style={fillStyle} />
        </View>
    );
};
