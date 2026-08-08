import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const BACKDROP_OPACITY = 0.85;
const FADE_IN_DURATION = 200;
const FADE_OUT_DURATION = 100;

interface Props {
    readonly isVisible: boolean;
    readonly onClose?: () => void;
}

export const AnimatedBackdrop = ({ isVisible, onClose }: Props) => {
    const [isMounted, setIsMounted] = useState(isVisible);

    const opacity = useSharedValue(isVisible ? BACKDROP_OPACITY : 0);

    useEffect(() => {
        if (isVisible) {
            // oxlint-disable-next-line react-hooks-js/set-state-in-effect -- Animation mount/unmount pattern: visibility deferred until close animation completes
            setIsMounted(true);
            opacity.value = withTiming(BACKDROP_OPACITY, { duration: FADE_IN_DURATION });
        } else if (isMounted) {
            opacity.value = withTiming(0, { duration: FADE_OUT_DURATION }, finished => {
                if (finished) {
                    runOnJS(setIsMounted)(false);
                }
            });
        }
    }, [isVisible, isMounted, opacity]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    const combinedStyle = [StyleSheet.absoluteFill, backdropStyle];

    if (!isVisible && !isMounted) {
        return null;
    }

    return <Animated.View className="absolute inset-0 bg-black" style={combinedStyle} onTouchEnd={onClose} />;
};
