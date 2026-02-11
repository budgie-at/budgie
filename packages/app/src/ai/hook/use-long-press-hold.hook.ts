import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useCallback, useRef } from 'react';
import { Easing, SharedValue, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import {
    LONG_PRESS_DURATION,
    LONG_PRESS_HAPTIC_INTERVAL,
    LONG_PRESS_RING_SNAP_BACK_DURATION,
    LONG_PRESS_SCALE_ON_PRESS,
    LONG_PRESS_SCALE_RESTORE_DURATION
} from '../constant/long-press-brain.constant';

const COMPLETION_THRESHOLD = 0.99;

interface UseLongPressHoldReturn {
    readonly holdProgress: SharedValue<number>;
    readonly pressScale: SharedValue<number>;
    readonly handlePressIn: () => void;
    readonly handlePressOut: () => void;
}

interface UseLongPressHoldParams {
    readonly onPress?: () => void;
    readonly onLongPressComplete: () => void;
    readonly disabled?: boolean;
}

export const useLongPressHold = ({ onPress, onLongPressComplete, disabled = false }: UseLongPressHoldParams): UseLongPressHoldReturn => {
    const [hapticNotification, hapticImpact] = useVibration();
    const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const completedRef = useRef(false);

    const holdProgress = useSharedValue(0);
    const pressScale = useSharedValue(1);

    const stopHapticInterval = useCallback(() => {
        if (hapticIntervalRef.current !== null) {
            clearInterval(hapticIntervalRef.current);
            hapticIntervalRef.current = null;
        }
    }, []);

    const startHapticInterval = useCallback(() => {
        hapticImpact(ImpactFeedbackStyle.Light);
        hapticIntervalRef.current = setInterval(() => {
            hapticImpact(ImpactFeedbackStyle.Light);
        }, LONG_PRESS_HAPTIC_INTERVAL);
    }, [hapticImpact]);

    const handleComplete = useCallback(() => {
        if (completedRef.current) {
            return;
        }

        completedRef.current = true;
        stopHapticInterval();
        holdProgress.set(withTiming(0, { duration: LONG_PRESS_RING_SNAP_BACK_DURATION }));
        pressScale.set(withTiming(1, { duration: LONG_PRESS_SCALE_RESTORE_DURATION }));
        hapticNotification(NotificationFeedbackType.Success);
        onLongPressComplete();
    }, [hapticNotification, holdProgress, onLongPressComplete, pressScale, stopHapticInterval]);

    useAnimatedReaction(
        () => holdProgress.get(),
        currentValue => {
            if (currentValue >= COMPLETION_THRESHOLD) {
                runOnJS(handleComplete)();
            }
        }
    );

    const handlePressIn = useCallback(() => {
        if (disabled) {
            return;
        }

        completedRef.current = false;
        holdProgress.set(withTiming(1, { duration: LONG_PRESS_DURATION, easing: Easing.linear }));
        pressScale.set(withTiming(LONG_PRESS_SCALE_ON_PRESS, { duration: LONG_PRESS_SCALE_RESTORE_DURATION }));
        startHapticInterval();
    }, [disabled, holdProgress, pressScale, startHapticInterval]);

    const handlePressOut = useCallback(() => {
        if (disabled) {
            return;
        }

        stopHapticInterval();

        if (!completedRef.current) {
            onPress?.();
        }

        holdProgress.set(withTiming(0, { duration: LONG_PRESS_RING_SNAP_BACK_DURATION }));
        pressScale.set(withTiming(1, { duration: LONG_PRESS_SCALE_RESTORE_DURATION }));
    }, [disabled, holdProgress, onPress, pressScale, stopHapticInterval]);

    return { holdProgress, pressScale, handlePressIn, handlePressOut };
};
