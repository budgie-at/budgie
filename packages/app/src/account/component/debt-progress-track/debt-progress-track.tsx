import { cn } from 'cn';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

interface Props {
    readonly percentage: number;
    readonly className?: string;
}

const FILL_DURATION = 400;
const FILL_EASING_X1 = 0.77;
const FILL_EASING_Y1 = 0;
const FILL_EASING_X2 = 0.175;
const FILL_EASING_Y2 = 1;
const FILL_EASING = Easing.bezier(FILL_EASING_X1, FILL_EASING_Y1, FILL_EASING_X2, FILL_EASING_Y2);

export const DebtProgressTrack = ({ percentage, className }: Props) => {
    const reducedMotion = useReducedMotion();
    const width = useSharedValue(percentage);

    useEffect(() => {
        width.set(reducedMotion ? percentage : withTiming(percentage, { duration: FILL_DURATION, easing: FILL_EASING }));
    }, [percentage, reducedMotion, width]);

    const fillStyle = useAnimatedStyle(() => ({ width: `${width.get()}%` }));

    return (
        <View className={cn('overflow-hidden rounded-full bg-secondary-background', className)}>
            <Animated.View className="h-full rounded-full bg-primary" style={fillStyle} />
        </View>
    );
};
