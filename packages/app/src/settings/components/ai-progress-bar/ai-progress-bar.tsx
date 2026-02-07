import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

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
        <Animated.View entering={FadeIn.duration(ANIMATION_DURATION)} exiting={FadeOut.duration(ANIMATION_DURATION)}>
            <View className="rounded-5xl bg-secondary-corner h-2 mt-lg">
                <Animated.View style={widthStyle} className="h-2 rounded-5xl bg-secondary-foreground" />
            </View>
        </Animated.View>
    );
};
