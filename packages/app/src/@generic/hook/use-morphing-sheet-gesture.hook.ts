import { Gesture } from 'react-native-gesture-handler';
import { cancelAnimation, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SHEET_PRESENT_SPRING } from '../constant/motion.constant';

import { useReducedMotion } from './use-reduced-motion.hook';

import type { MorphingSheetDragInterface } from '../interface/morphing-sheet-drag.interface';

const DISMISS_DISTANCE_RATIO = 0.3;
const DISMISS_VELOCITY = 800;
const MAX_RUBBER_BAND = 24;
const RUBBER_BAND_FACTOR = 2;
const ACTIVE_OFFSET_Y = 8;

export const useMorphingSheetGesture = (drag: MorphingSheetDragInterface) => {
    const { translateY, visibleHeight, isDismissing, isDragging, isEnabled, onSwipeDismiss } = drag;
    const isReducedMotion = useReducedMotion();
    const dragStart = useSharedValue(0);

    return Gesture.Pan()
        .enabled(isEnabled)
        .activeOffsetY([-ACTIVE_OFFSET_Y, ACTIVE_OFFSET_Y])
        .onTouchesDown((_event, manager) => {
            if (isDismissing.get()) {
                manager.fail();
            }
        })
        .onStart(() => {
            cancelAnimation(translateY);
            dragStart.set(translateY.get());
            isDragging.set(true);
        })
        .onUpdate(event => {
            if (isDismissing.get()) {
                return;
            }

            const next = dragStart.get() + event.translationY;
            const rubberBand = -Math.min(MAX_RUBBER_BAND, Math.sqrt(-next) * RUBBER_BAND_FACTOR);

            translateY.set(next >= 0 ? next : rubberBand);
        })
        .onEnd(event => {
            if (isDismissing.get()) {
                return;
            }

            const isDismissed = event.translationY > visibleHeight.get() * DISMISS_DISTANCE_RATIO || event.velocityY > DISMISS_VELOCITY;

            if (isDismissed) {
                scheduleOnRN(onSwipeDismiss, event.velocityY);
            } else {
                translateY.set(isReducedMotion ? 0 : withSpring(0, { ...SHEET_PRESENT_SPRING, velocity: event.velocityY }));
            }
        })
        .onFinalize(() => {
            isDragging.set(false);
        });
};
