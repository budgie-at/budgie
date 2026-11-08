import { Gesture } from 'react-native-gesture-handler';
import { cancelAnimation, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SHEET_PRESENT_SPRING } from '../constant/motion.constant';

import type { UseMorphingSheetGestureParamsInterface } from '../interface/use-morphing-sheet-gesture-params.interface';

const DISMISS_DISTANCE_RATIO = 0.3;
const DISMISS_VELOCITY = 800;
const MAX_RUBBER_BAND = 24;
const RUBBER_BAND_FACTOR = 2;
const ACTIVE_OFFSET_Y = 8;

export const useMorphingSheetGesture = ({ translateY, visibleHeight, isEnabled, onDismiss }: UseMorphingSheetGestureParamsInterface) => {
    const dragStart = useSharedValue(0);

    return Gesture.Pan()
        .enabled(isEnabled)
        .activeOffsetY([-ACTIVE_OFFSET_Y, ACTIVE_OFFSET_Y])
        .onStart(() => {
            cancelAnimation(translateY);
            dragStart.set(translateY.get());
        })
        .onUpdate(event => {
            const next = dragStart.get() + event.translationY;
            const rubberBand = -Math.min(MAX_RUBBER_BAND, Math.sqrt(-next) * RUBBER_BAND_FACTOR);

            translateY.set(next >= 0 ? next : rubberBand);
        })
        .onEnd(event => {
            const isDismissed = event.translationY > visibleHeight.get() * DISMISS_DISTANCE_RATIO || event.velocityY > DISMISS_VELOCITY;

            if (isDismissed) {
                scheduleOnRN(onDismiss, event.velocityY);
            } else {
                translateY.set(withSpring(0, { ...SHEET_PRESENT_SPRING, velocity: event.velocityY }));
            }
        });
};
