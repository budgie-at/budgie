import { useEffect, useRef, useState } from 'react';
import { Easing, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

const BACKDROP_OPACITY = 0.3;
const MENU_SCALE_CLOSED = 0.95;
const ANIMATION_DURATION = 150;

const TIMING_CONFIG = { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) };

// eslint-disable-next-line max-statements -- Animation hook with multiple shared values and animation callbacks
export const usePopoverAnimation = (isOpen: boolean, onCloseComplete?: EmptyFn) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const isMountedRef = useRef(true);
    const onCloseCompleteRef = useRef(onCloseComplete);

    useEffect(() => {
        onCloseCompleteRef.current = onCloseComplete;
    }, [onCloseComplete]);

    const isOpenShared = useSharedValue(isOpen);
    const backdropOpacity = useSharedValue(isOpen ? BACKDROP_OPACITY : 0);
    const menuScale = useSharedValue(isOpen ? 1 : MENU_SCALE_CLOSED);
    const menuOpacity = useSharedValue(isOpen ? 1 : 0);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        isOpenShared.value = isOpen;
    }, [isOpen, isOpenShared]);

    const safeSetIsAnimatingOut = (value: boolean) => {
        if (isMountedRef.current) {
            setIsAnimatingOut(value);
        }
    };

    const handleCloseComplete = () => {
        if (isMountedRef.current) {
            onCloseCompleteRef.current?.();
        }
    };

    useAnimatedReaction(
        () => isOpenShared.value,
        (current, previous) => {
            if (current && !previous) {
                backdropOpacity.value = withTiming(BACKDROP_OPACITY, TIMING_CONFIG);
                menuScale.value = withTiming(1, TIMING_CONFIG);
                menuOpacity.value = withTiming(1, TIMING_CONFIG);
            } else if (!current && previous) {
                runOnJS(safeSetIsAnimatingOut)(true);
                backdropOpacity.value = withTiming(0, TIMING_CONFIG);
                menuScale.value = withTiming(MENU_SCALE_CLOSED, TIMING_CONFIG);
                menuOpacity.value = withTiming(0, TIMING_CONFIG, finished => {
                    if (finished) {
                        runOnJS(safeSetIsAnimatingOut)(false);
                        runOnJS(handleCloseComplete)();
                    }
                });
            }
        },
        [isOpen]
    );

    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
    const menuStyle = useAnimatedStyle(() => ({ opacity: menuOpacity.value, transform: [{ scale: menuScale.value }] }));

    return { isAnimatingOut, backdropStyle, menuStyle };
};
