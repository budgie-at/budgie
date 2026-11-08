import { useEffect, useEffectEvent, useRef } from 'react';
import { Keyboard } from 'react-native';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { isDefined } from '@rnw-community/shared';

import { EASE_OUT, MOTION_BASE_DURATION, SHEET_PRESENT_SPRING } from '../constant/motion.constant';

import { useMorphingSheetDismissMotion } from './use-morphing-sheet-dismiss-motion.hook';
import { useMorphingSheetFrame } from './use-morphing-sheet-frame.hook';
import { useMorphingSheetMorph } from './use-morphing-sheet-morph.hook';
import { useReducedMotion } from './use-reduced-motion.hook';

import type { LayoutChangeEvent } from 'react-native';

const SHEET_RESIZE_SPRING = { mass: 1, stiffness: 600, damping: 44.6 };
const PRESENT_FADE_TIMING = { duration: MOTION_BASE_DURATION, easing: EASE_OUT };

export const useMorphingSheetMotion = (activeStep: string, onDismiss: () => void, onPresented: () => void) => {
    const { baseBottom, frameHeight } = useMorphingSheetFrame();
    const isReducedMotion = useReducedMotion();
    const tracker = useRef({ latest: activeStep, previous: activeStep, isStepChangePending: false, heights: new Map<string, number>() });
    const translateY = useSharedValue(frameHeight + baseBottom);
    const visibleHeight = useSharedValue(0);
    const isMeasured = useSharedValue(false);
    const { morph, beginMorph } = useMorphingSheetMorph(visibleHeight);
    const { handleDismiss, handleSwipeDismiss } = useMorphingSheetDismissMotion(translateY, visibleHeight, baseBottom, onDismiss);

    const applyHeight = (height: number, isStepChange: boolean) => {
        const nextHeight = Math.min(height, frameHeight);

        if (!isMeasured.get()) {
            isMeasured.set(true);
            visibleHeight.set(nextHeight);
            translateY.set(nextHeight + baseBottom);

            const handlePresentFinished = (isFinished?: boolean) => {
                if (isFinished) {
                    scheduleOnRN(onPresented);
                }
            };

            translateY.set(
                isReducedMotion
                    ? withTiming(0, PRESENT_FADE_TIMING, handlePresentFinished)
                    : withSpring(0, SHEET_PRESENT_SPRING, handlePresentFinished)
            );

            return;
        }

        if (isStepChange) {
            beginMorph(tracker.current.previous, tracker.current.latest, visibleHeight.get(), nextHeight);
        }

        visibleHeight.set(isReducedMotion ? nextHeight : withSpring(nextHeight, SHEET_RESIZE_SPRING));
    };

    const handleActiveStepChange = useEffectEvent(() => {
        if (tracker.current.latest === activeStep) {
            return;
        }

        tracker.current.previous = tracker.current.latest;
        tracker.current.latest = activeStep;
        Keyboard.dismiss();

        const cachedHeight = tracker.current.heights.get(activeStep);

        if (isDefined(cachedHeight)) {
            applyHeight(cachedHeight, true);
        } else {
            tracker.current.isStepChangePending = true;
        }
    });

    useEffect(() => {
        handleActiveStepChange();
    }, [activeStep]);

    const handleStepLayout = (step: string, event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;

        tracker.current.heights.set(step, height);

        if (step === tracker.current.latest) {
            const isStepChange = tracker.current.isStepChangePending;

            tracker.current.isStepChangePending = false;
            applyHeight(height, isStepChange);
        }
    };

    return { baseBottom, frameHeight, translateY, visibleHeight, morph, handleDismiss, handleSwipeDismiss, handleStepLayout };
};
