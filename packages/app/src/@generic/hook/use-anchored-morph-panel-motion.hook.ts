import { useEffect, useEffectEvent, useState } from 'react';
import { Keyboard } from 'react-native';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EASE_OUT, MOTION_BASE_DURATION, PREPARE_DELAY_MS } from '../constant/motion.constant';

import { useAnchoredMorphPanelStyle } from './use-anchored-morph-panel-style.hook';
import { useReducedMotion } from './use-reduced-motion.hook';

import type { AnchoredMorphOriginInterface } from '../interface/anchored-morph-origin.interface';
import type { LayoutChangeEvent } from 'react-native';

const OPEN_SPRING = { mass: 1, stiffness: 480, damping: 44, overshootClamping: true };
const CLOSE_SPRING = { mass: 1, stiffness: 900, damping: 60, overshootClamping: true };
const REDUCED_TIMING = { duration: MOTION_BASE_DURATION, easing: EASE_OUT };

export const useAnchoredMorphPanelMotion = (origin: AnchoredMorphOriginInterface, fitsContent: boolean, onDismissed: () => void) => {
    const isReducedMotion = useReducedMotion();
    const progress = useSharedValue(0);
    const [isSettled, setIsSettled] = useState(false);
    const isClosing = useSharedValue(false);
    const settledKeyboardHeight = useSharedValue(0);
    const contentHeight = useSharedValue(0);

    useKeyboardHandler({
        onStart: event => {
            'worklet';

            if (!isClosing.get()) {
                settledKeyboardHeight.set(Math.abs(event.height));
            }
        }
    });

    const handleOpen = useEffectEvent(() => {
        const handleOpened = (isFinished?: boolean) => {
            if (isFinished) {
                scheduleOnRN(setIsSettled, true);
            }
        };

        progress.set(
            withDelay(
                PREPARE_DELAY_MS,
                isReducedMotion ? withTiming(1, REDUCED_TIMING, handleOpened) : withSpring(1, OPEN_SPRING, handleOpened)
            )
        );
    });

    useEffect(() => {
        handleOpen();
    }, []);

    const handleClose = () => {
        if (isClosing.get()) {
            return;
        }

        isClosing.set(true);
        Keyboard.dismiss();

        const handleFinished = (isFinished?: boolean) => {
            if (isFinished) {
                scheduleOnRN(onDismissed);
            }
        };

        progress.set(isReducedMotion ? withTiming(0, REDUCED_TIMING, handleFinished) : withSpring(0, CLOSE_SPRING, handleFinished));
    };

    const handleContentLayout = (event: LayoutChangeEvent) => void contentHeight.set(event.nativeEvent.layout.height);

    return {
        ...useAnchoredMorphPanelStyle(progress, settledKeyboardHeight, fitsContent ? contentHeight : null, origin),
        handleClose,
        handleContentLayout,
        isSettled
    };
};
