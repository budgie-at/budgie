import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AudioBar } from './audio-bar';

interface Props {
    readonly level: number;
    readonly isActive: boolean;
}

const BAR_COUNT = 5;

export const AudioLevelIndicator = ({ level, isActive }: Props) => {
    const containerOpacity = useSharedValue(0);

    useEffect(() => {
        containerOpacity.value = withTiming(isActive ? 1 : 0, { duration: 200 });
    }, [containerOpacity, isActive]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value
    }));

    return (
        <Animated.View className="flex-row items-center justify-center gap-1 h-8 mb-4" style={containerStyle}>
            {Array.from({ length: BAR_COUNT }).map((_, index) => (
                <AudioBar key={index} index={index} level={level} isActive={isActive} barCount={BAR_COUNT} />
            ))}
        </Animated.View>
    );
};
