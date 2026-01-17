import { useEffect } from 'react';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import { BUTTON_SIZE, RING_SIZE, STROKE_WIDTH, THINKING_COLOR } from '../animated-record-button/animated-record-button.constant';

const PULSE_DURATION = 1500;
const MIN_OPACITY = 0.4;
const MAX_OPACITY = 1;
const MIN_SCALE = 1;
const MAX_SCALE = 1.08;

const RING_GAP = 6;
const INNER_RING_RADIUS = BUTTON_SIZE / 2 + RING_GAP;
const INNER_RING_CENTER = RING_SIZE / 2;

export const ThinkingRing = () => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.set(withRepeat(withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }), -1, true));
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => ({
        height: RING_SIZE,
        width: RING_SIZE,
        opacity: interpolate(progress.value, [0, 1], [MIN_OPACITY, MAX_OPACITY]),
        transform: [{ scale: interpolate(progress.value, [0, 1], [MIN_SCALE, MAX_SCALE]) }]
    }));

    return (
        <Animated.View className="absolute left-0 top-0 items-center justify-center" style={animatedStyle}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                    cx={INNER_RING_CENTER}
                    cy={INNER_RING_CENTER}
                    r={INNER_RING_RADIUS}
                    stroke={THINKING_COLOR}
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    fill="none"
                />
            </Svg>
        </Animated.View>
    );
};
