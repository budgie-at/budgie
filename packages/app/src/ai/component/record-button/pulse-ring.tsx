import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { BUTTON_SIZE, RECORDING_COLOR } from './animated-record-button.constant';

interface Props {
    readonly index: number;
    readonly audioLevel: number;
}

const SCALE_MULTIPLIER = 0.5;
const INDEX_SCALE_OFFSET = 0.15;
const BASE_OPACITY = 0.6;
const ANIMATION_DURATION = 100;
const RESET_DURATION = 300;
const AUDIO_THRESHOLD = 0.01;

export const PulseRing = ({ index, audioLevel }: Props) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (audioLevel > AUDIO_THRESHOLD) {
            const targetScale = 1 + audioLevel * SCALE_MULTIPLIER + index * INDEX_SCALE_OFFSET;
            scale.value = withSpring(targetScale, { damping: 10, stiffness: 100 });
            opacity.value = withTiming(BASE_OPACITY - index * INDEX_SCALE_OFFSET, { duration: ANIMATION_DURATION });
        } else {
            scale.value = withTiming(1, { duration: RESET_DURATION });
            opacity.value = withTiming(0, { duration: RESET_DURATION });
        }
    }, [audioLevel, index, opacity, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        borderColor: RECORDING_COLOR,
        borderRadius: BUTTON_SIZE / 2,
        borderWidth: 2,
        height: BUTTON_SIZE,
        opacity: opacity.value,
        position: 'absolute' as const,
        transform: [{ scale: scale.value }],
        width: BUTTON_SIZE
    }));

    return <Animated.View style={animatedStyle} />;
};
