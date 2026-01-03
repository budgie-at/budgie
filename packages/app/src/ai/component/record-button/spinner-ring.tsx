import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import {
    ACCENT_COLOR,
    RING_CENTER,
    RING_CIRCUMFERENCE,
    RING_RADIUS,
    RING_SIZE,
    STROKE_WIDTH
} from './animated-record-button.constant';
import { ringContainerStyle } from './ring-container.style';

const ROTATION_DURATION = 1500;
const DASH_RATIO = 0.25;
const GAP_RATIO = 0.75;
const RING_OPACITY = 0.8;

export const SpinnerRing = () => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(withTiming(360, { duration: ROTATION_DURATION, easing: Easing.linear }), -1, false);
    }, [rotation]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    const dashLength = RING_CIRCUMFERENCE * DASH_RATIO;
    const gapLength = RING_CIRCUMFERENCE * GAP_RATIO;
    const combinedStyle = [ringContainerStyle, animatedStyle];

    return (
        <Animated.View style={combinedStyle}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                    cx={RING_CENTER}
                    cy={RING_CENTER}
                    r={RING_RADIUS}
                    stroke={ACCENT_COLOR}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${dashLength} ${gapLength}`}
                    strokeLinecap="round"
                    fill="none"
                    opacity={RING_OPACITY}
                />
            </Svg>
        </Animated.View>
    );
};
