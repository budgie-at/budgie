import { useEffect } from 'react';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const PULSE_DURATION = 850;
const MIN_OPACITY = 0.42;
const STATIC_OPACITY = 0.7;
const MAX_OPACITY = 1;

export const useSkeletonPulseStyle = () => {
    const reducedMotion = useReducedMotion();
    const opacity = useSharedValue(MAX_OPACITY);

    useEffect(() => {
        opacity.value = reducedMotion ? STATIC_OPACITY : withRepeat(withTiming(MIN_OPACITY, { duration: PULSE_DURATION }), -1, true);
    }, [opacity, reducedMotion]);

    return useAnimatedStyle(() => ({ opacity: opacity.value }));
};
