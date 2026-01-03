import { useEffect } from 'react';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

import { RING_CIRCUMFERENCE, THINKING_COLOR } from './animated-record-button.constant';
import { BaseRing } from './base-ring';
import { ringContainerStyle } from './ring-container.style';

const ANIMATION_DURATION = 1000;
const MIN_OPACITY = 0.4;
const MAX_OPACITY = 1;
const MID_PROGRESS = 0.5;
const ROTATION_OFFSET = -90;
const HALF_CIRCUMFERENCE = RING_CIRCUMFERENCE / 2;
const MIN_SCALE = 0.95;
const MAX_SCALE = 1.05;

export const ThinkingRing = () => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.set(
            withRepeat(
                withSequence(
                    withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            )
        );
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, MID_PROGRESS, 1], [MIN_OPACITY, MAX_OPACITY, MIN_OPACITY]),
        transform: [{ scale: interpolate(progress.value, [0, MID_PROGRESS, 1], [MIN_SCALE, MAX_SCALE, MIN_SCALE]) }]
    }));

    const combinedStyle = [ringContainerStyle, animatedStyle];

    return (
        <Animated.View style={combinedStyle}>
            <BaseRing
                stroke={THINKING_COLOR}
                strokeDasharray={`${HALF_CIRCUMFERENCE} ${HALF_CIRCUMFERENCE}`}
                rotation={ROTATION_OFFSET}
            />
        </Animated.View>
    );
};
