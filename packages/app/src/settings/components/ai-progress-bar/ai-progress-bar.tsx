import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EASE_OUT } from '../../../@generic/constant/motion.constant';
import { cn } from '../../../@generic/utils/cn.util';

const ANIMATION_DURATION = 300;

interface Props {
    readonly progress: number;
    readonly trackClassName?: string;
}

export const AiProgressBar = ({ progress, trackClassName = 'h-2' }: Props) => {
    const progressValue = useSharedValue(0);

    useEffect(() => {
        progressValue.set(withTiming(progress, { duration: ANIMATION_DURATION, easing: EASE_OUT }));
    }, [progress, progressValue]);

    const widthStyle = useAnimatedStyle(() => ({
        width: `${progressValue.value}%`
    }));

    return (
        <View className={cn('rounded-5xl bg-secondary-corner', trackClassName)}>
            <Animated.View style={widthStyle} className="h-full rounded-5xl bg-secondary-foreground" />
        </View>
    );
};
