import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

const BACKDROP_OPACITY = 0.3;
const MENU_SCALE_CLOSED = 0.95;

const TIMING_CONFIG = { duration: 150, easing: Easing.out(Easing.cubic) };

// eslint-disable-next-line max-statements -- Close sequencing tracks the animation and the iOS native dismissal as separate phases
export const usePopoverAnimation = (isOpen: boolean, onCloseComplete?: EmptyFn) => {
    const progress = useSharedValue(isOpen ? 1 : 0);
    const [isClosing, setIsClosing] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);
    const [previousIsOpen, setPreviousIsOpen] = useState(isOpen);
    const notifyCloseComplete = useEffectEvent(() => onCloseComplete?.());
    const isRendered = isOpen || isClosing || isDismissing;
    const wasRenderedRef = useRef(isRendered);

    if (isOpen !== previousIsOpen) {
        setPreviousIsOpen(isOpen);
        setIsClosing(!isOpen);
        setIsDismissing(!isOpen && Platform.OS === 'ios');
    }

    useEffect(() => {
        if (wasRenderedRef.current && !isRendered) {
            notifyCloseComplete();
        }

        wasRenderedRef.current = isRendered;
    }, [isRendered]);

    useEffect(() => {
        if (isOpen) {
            progress.set(withTiming(1, TIMING_CONFIG));
        } else if (isClosing) {
            progress.set(
                withTiming(0, TIMING_CONFIG, isFinished => {
                    if (isFinished) {
                        runOnJS(setIsClosing)(false);
                    }
                })
            );
        }
    }, [isOpen, isClosing, progress]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() * BACKDROP_OPACITY }));
    const menuStyle = useAnimatedStyle(() => ({
        opacity: progress.get(),
        transform: [{ scale: interpolate(progress.get(), [0, 1], [MENU_SCALE_CLOSED, 1]) }]
    }));

    return { isRendered, isVisible: isOpen || isClosing, handleDismiss: () => void setIsDismissing(false), backdropStyle, menuStyle };
};
