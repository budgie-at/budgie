import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { ACCENT_COLOR, RING_CIRCUMFERENCE } from './animated-record-button.constant';
import { BaseRing } from './base-ring';
import { ringContainerStyle } from './ring-container.style';

const ROTATION_DURATION = 1500;
const DASH_RATIO = 0.25;
const GAP_RATIO = 0.75;
const RING_OPACITY = 0.8;

export const SpinnerRing = () => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.set(withRepeat(withTiming(360, { duration: ROTATION_DURATION, easing: Easing.linear }), -1, false));
    }, [rotation]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    const dashLength = RING_CIRCUMFERENCE * DASH_RATIO;
    const gapLength = RING_CIRCUMFERENCE * GAP_RATIO;
    const combinedStyle = [ringContainerStyle, animatedStyle];

    return (
        <Animated.View style={combinedStyle}>
            <BaseRing stroke={ACCENT_COLOR} strokeDasharray={`${dashLength} ${gapLength}`} opacity={RING_OPACITY} />
        </Animated.View>
    );
};
