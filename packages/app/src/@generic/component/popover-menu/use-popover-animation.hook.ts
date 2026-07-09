import { useEffect, useRef, useState } from 'react';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EmptyFn, isDefined } from '@rnw-community/shared';

const BACKDROP_OPACITY = 0.3;
const MENU_SCALE_CLOSED = 0.95;
const ANIMATION_DURATION = 150;
const CLOSE_COMPLETION_BUFFER = 50;

const TIMING_CONFIG = { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) };

export const usePopoverAnimation = (isOpen: boolean, onCloseComplete?: EmptyFn) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [previousIsOpen, setPreviousIsOpen] = useState(isOpen);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onCloseCompleteRef = useRef(onCloseComplete);

    const backdropOpacity = useSharedValue(isOpen ? BACKDROP_OPACITY : 0);
    const menuScale = useSharedValue(isOpen ? 1 : MENU_SCALE_CLOSED);
    const menuOpacity = useSharedValue(isOpen ? 1 : 0);

    if (isOpen !== previousIsOpen) {
        setPreviousIsOpen(isOpen);
        setIsAnimatingOut(!isOpen);
    }

    useEffect(() => {
        onCloseCompleteRef.current = onCloseComplete;
    });

    useEffect(() => {
        if (isOpen) {
            backdropOpacity.value = withTiming(BACKDROP_OPACITY, TIMING_CONFIG);
            menuScale.value = withTiming(1, TIMING_CONFIG);
            menuOpacity.value = withTiming(1, TIMING_CONFIG);
        } else if (isAnimatingOut) {
            backdropOpacity.value = withTiming(0, TIMING_CONFIG);
            menuScale.value = withTiming(MENU_SCALE_CLOSED, TIMING_CONFIG);
            menuOpacity.value = withTiming(0, TIMING_CONFIG);

            closeTimerRef.current = setTimeout(() => {
                closeTimerRef.current = null;
                setIsAnimatingOut(false);
                onCloseCompleteRef.current?.();
            }, ANIMATION_DURATION + CLOSE_COMPLETION_BUFFER);
        }

        return () => {
            if (isDefined(closeTimerRef.current)) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
        };
    }, [isOpen, isAnimatingOut, backdropOpacity, menuScale, menuOpacity]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
    const menuStyle = useAnimatedStyle(() => ({ opacity: menuOpacity.value, transform: [{ scale: menuScale.value }] }));

    return { isAnimatingOut, backdropStyle, menuStyle };
};
