import { Keyboard } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EASE_IN_OUT, SHEET_PRESENT_SPRING } from '../constant/motion.constant';

import { useReducedMotion } from './use-reduced-motion.hook';

import type { SharedValue } from 'react-native-reanimated';

const DISMISS_TIMING = { duration: 160, easing: EASE_IN_OUT };
const DISMISS_SPRING = { ...SHEET_PRESENT_SPRING, overshootClamping: true };

export const useMorphingSheetDismissMotion = (
    translateY: SharedValue<number>,
    visibleHeight: SharedValue<number>,
    baseBottom: number,
    onDismiss: () => void
) => {
    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
    const isReducedMotion = useReducedMotion();
    const isDismissing = useSharedValue(false);

    const dismissWithVelocity = (velocity: number) => {
        if (isDismissing.get()) {
            return;
        }

        isDismissing.set(true);
        Keyboard.dismiss();

        const target = visibleHeight.get() + baseBottom + Math.abs(keyboardHeight.get());
        const handleFinished = (isFinished?: boolean) => {
            if (isFinished) {
                scheduleOnRN(onDismiss);
            }
        };

        translateY.set(
            isReducedMotion
                ? withTiming(target, DISMISS_TIMING, handleFinished)
                : withSpring(target, { ...DISMISS_SPRING, velocity }, handleFinished)
        );
    };

    const handleDismiss = () => {
        dismissWithVelocity(0);
    };

    return { isDismissing, handleDismiss, handleSwipeDismiss: dismissWithVelocity };
};
