import { useEffect } from 'react';
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import {
    RING_CENTER,
    RING_CIRCUMFERENCE,
    RING_RADIUS,
    RING_SIZE,
    STROKE_WIDTH,
    THINKING_COLOR
} from './animated-record-button.constant';
import { ringContainerStyle } from './ring-container.style';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ANIMATION_DURATION = 1000;
const MIN_OPACITY = 0.4;
const MAX_OPACITY = 1;
const MID_PROGRESS = 0.5;
const ROTATION_OFFSET = -90;

export const ThinkingRing = () => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withSequence(
                withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );
    }, [progress]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: interpolate(progress.value, [0, 1], [RING_CIRCUMFERENCE, 0])
    }));

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, MID_PROGRESS, 1], [MIN_OPACITY, MAX_OPACITY, MIN_OPACITY])
    }));

    const combinedStyle = [ringContainerStyle, animatedStyle];

    return (
        <Animated.View style={combinedStyle}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
                <AnimatedCircle
                    cx={RING_CENTER}
                    cy={RING_CENTER}
                    r={RING_RADIUS}
                    stroke={THINKING_COLOR}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeLinecap="round"
                    fill="none"
                    rotation={ROTATION_OFFSET}
                    origin={`${RING_CENTER}, ${RING_CENTER}`}
                    animatedProps={animatedProps}
                />
            </Svg>
        </Animated.View>
    );
};
