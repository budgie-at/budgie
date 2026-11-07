import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { RING_CIRCUMFERENCE, RING_SIZE } from '../../constant/animated-record-button.constant';
import { BaseRing } from '../base-ring/base-ring';

const ROTATION_DURATION = 1500;
const DASH_RATIO = 0.25;
const GAP_RATIO = 0.75;
const RING_OPACITY = 0.8;
const REDUCED_MIN_OPACITY = 0.5;
const REDUCED_PULSE_DURATION = 1000;

export const SpinnerRing = () => {
    const reducedMotion = useReducedMotion();
    const rotation = useSharedValue(0);
    const pulseOpacity = useSharedValue(1);

    useEffect(() => {
        if (reducedMotion) {
            rotation.set(0);
            pulseOpacity.set(
                withRepeat(
                    withTiming(REDUCED_MIN_OPACITY, { duration: REDUCED_PULSE_DURATION, easing: Easing.inOut(Easing.sin) }),
                    -1,
                    true
                )
            );

            return;
        }

        pulseOpacity.set(1);
        rotation.set(withRepeat(withTiming(360, { duration: ROTATION_DURATION, easing: Easing.linear }), -1, false));
    }, [pulseOpacity, reducedMotion, rotation]);

    const animatedStyle = useAnimatedStyle(() => ({
        height: RING_SIZE,
        width: RING_SIZE,
        opacity: pulseOpacity.value,
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    const dashLength = RING_CIRCUMFERENCE * DASH_RATIO;
    const gapLength = RING_CIRCUMFERENCE * GAP_RATIO;

    return (
        <Animated.View className="absolute left-0 top-0 items-center justify-center" style={animatedStyle}>
            <BaseRing strokeClassName="accent-default-foreground" strokeDasharray={`${dashLength} ${gapLength}`} opacity={RING_OPACITY} />
        </Animated.View>
    );
};
