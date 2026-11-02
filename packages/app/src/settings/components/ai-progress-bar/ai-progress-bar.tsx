import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { cn } from '../../../@generic/utils/cn.util';

const ANIMATION_DURATION = 300;

interface Props {
    readonly progress: number;
    readonly trackClassName?: string;
}

export const AiProgressBar = ({ progress, trackClassName = 'h-2' }: Props) => {
    const progressValue = useSharedValue(0);

    useEffect(() => {
        progressValue.set(progress);
    }, [progress, progressValue]);

    const widthStyle = useAnimatedStyle(() => ({
        width: withTiming(`${progressValue.value}%`, { duration: ANIMATION_DURATION })
    }));

    return (
        <View className={cn('rounded-5xl bg-secondary-corner', trackClassName)}>
            <Animated.View style={widthStyle} className="h-full rounded-5xl bg-secondary-foreground" />
        </View>
    );
};
