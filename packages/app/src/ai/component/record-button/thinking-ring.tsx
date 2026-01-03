import { useEffect } from 'react';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

import { THINKING_COLOR } from './animated-record-button.constant';
import { BaseRing } from './base-ring';
import { ringContainerStyle } from './ring-container.style';

const PULSE_DURATION = 1500;
const MIN_OPACITY = 0.3;
const MAX_OPACITY = 0.9;
const MIN_SCALE = 0.9;
const MAX_SCALE = 1.1;

export const ThinkingRing = () => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.set(withRepeat(withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }), -1, true));
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [MIN_OPACITY, MAX_OPACITY]),
        transform: [{ scale: interpolate(progress.value, [0, 1], [MIN_SCALE, MAX_SCALE]) }]
    }));

    const combinedStyle = [ringContainerStyle, animatedStyle];

    return (
        <Animated.View style={combinedStyle}>
            <BaseRing stroke={THINKING_COLOR} />
        </Animated.View>
    );
};
