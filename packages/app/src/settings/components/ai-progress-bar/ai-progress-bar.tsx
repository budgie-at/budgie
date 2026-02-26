import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const ANIMATION_DURATION = 300;

interface Props {
    readonly progress: number;
}

export const AiProgressBar = ({ progress }: Props) => {
    const progressValue = useSharedValue(0);

    useEffect(() => {
        progressValue.value = progress;
    }, [progress, progressValue]);

    const widthStyle = useAnimatedStyle(() => ({
        width: withTiming(`${progressValue.value}%`, { duration: ANIMATION_DURATION })
    }));

    return (
        <View className="rounded-5xl bg-secondary-corner h-2">
            <Animated.View style={widthStyle} className="h-2 rounded-5xl bg-secondary-foreground" />
        </View>
    );
};
