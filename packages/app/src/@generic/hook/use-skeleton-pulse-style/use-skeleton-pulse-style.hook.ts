import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const PULSE_DURATION = 850;
const MIN_OPACITY = 0.42;
const MAX_OPACITY = 1;

export const useSkeletonPulseStyle = () => {
    const opacity = useSharedValue(MAX_OPACITY);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(MIN_OPACITY, { duration: PULSE_DURATION }), -1, true);
    }, [opacity]);

    return useAnimatedStyle(() => ({ opacity: opacity.value }));
};
