import { useCallback, useEffect, useRef, useState } from 'react';
import { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

const BACKDROP_OPACITY = 0.3;
const MENU_SCALE_CLOSED = 0.95;

const TIMING_CONFIG = { duration: 150, easing: Easing.out(Easing.cubic) };

export const usePopoverAnimation = (isOpen: boolean, onCloseComplete?: EmptyFn) => {
    const progress = useSharedValue(isOpen ? 1 : 0);
    const [isClosing, setIsClosing] = useState(false);
    const [previousIsOpen, setPreviousIsOpen] = useState(isOpen);
    const onCloseCompleteRef = useRef(onCloseComplete);

    if (isOpen !== previousIsOpen) {
        setPreviousIsOpen(isOpen);
        setIsClosing(!isOpen);
    }

    useEffect(() => {
        onCloseCompleteRef.current = onCloseComplete;
    });

    const finishClose = useCallback(() => {
        setIsClosing(false);
        onCloseCompleteRef.current?.();
    }, []);

    useEffect(() => {
        if (isOpen) {
            progress.set(withTiming(1, TIMING_CONFIG));
        } else if (isClosing) {
            progress.set(
                withTiming(0, TIMING_CONFIG, isFinished => {
                    if (isFinished) {
                        runOnJS(finishClose)();
                    }
                })
            );
        }
    }, [isOpen, isClosing, progress, finishClose]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() * BACKDROP_OPACITY }));
    const menuStyle = useAnimatedStyle(() => ({
        opacity: progress.get(),
        transform: [{ scale: interpolate(progress.get(), [0, 1], [MENU_SCALE_CLOSED, 1]) }]
    }));

    return { isRendered: isOpen || isClosing, backdropStyle, menuStyle };
};
