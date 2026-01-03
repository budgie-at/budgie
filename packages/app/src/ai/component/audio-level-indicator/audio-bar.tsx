import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface Props {
    readonly index: number;
    readonly level: number;
    readonly isActive: boolean;
    readonly barCount: number;
}

const SPRING_CONFIG = { damping: 15, stiffness: 300 };
const MIN_HEIGHT = 8;
const MAX_HEIGHT = 32;
const LEVEL_MULTIPLIER = 24;
const BASE_OPACITY = 0.3;
const LEVEL_OPACITY_MULTIPLIER = 0.7;
const RANDOM_FACTOR_MIN = 0.7;
const RANDOM_FACTOR_RANGE = 0.3;

export const AudioBar = ({ index, level, isActive, barCount }: Props) => {
    const height = useSharedValue(MIN_HEIGHT);
    const opacity = useSharedValue(BASE_OPACITY);

    useEffect(() => {
        if (!isActive) {
            height.value = withTiming(MIN_HEIGHT, { duration: 200 });
            opacity.value = withTiming(BASE_OPACITY, { duration: 200 });

            return;
        }

        const centerDistance = Math.abs(index - Math.floor(barCount / 2));
        const normalizedDistance = 1 - centerDistance / (barCount / 2);
        const randomFactor = RANDOM_FACTOR_MIN + Math.random() * RANDOM_FACTOR_RANGE;
        const targetHeight = MIN_HEIGHT + level * LEVEL_MULTIPLIER * normalizedDistance * randomFactor;

        height.value = withSpring(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, targetHeight)), SPRING_CONFIG);
        opacity.value = withSpring(BASE_OPACITY + level * LEVEL_OPACITY_MULTIPLIER, SPRING_CONFIG);
    }, [barCount, height, index, isActive, level, opacity]);

    const barStyle = useAnimatedStyle(() => ({
        height: height.value,
        opacity: opacity.value
    }));

    return <Animated.View className="w-1 bg-accent rounded-full" style={barStyle} />;
};
