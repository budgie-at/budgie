import { useAnimatedReaction, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EASE_OUT, MOTION_BASE_DURATION, PREPARE_DELAY_MS, SHEET_RESIZE_SPRING } from '../constant/motion.constant';
import { PageMotionPhaseEnum } from '../enum/page-motion-phase.enum';

import { useReducedMotion } from './use-reduced-motion.hook';

import type { SharedValue } from 'react-native-reanimated';

const PAGE_FADE_TIMING = { duration: MOTION_BASE_DURATION, easing: EASE_OUT };

export const useMorphingSheetPageMotion = (
    pageProgress: SharedValue<number>,
    onSettled: (isSettled: boolean) => void,
    onCollapsed: () => void
) => {
    const isReducedMotion = useReducedMotion();
    const phase = useSharedValue(PageMotionPhaseEnum.IDLE);

    const expand = () => {
        phase.set(PageMotionPhaseEnum.EXPANDING);
        pageProgress.set(
            withDelay(PREPARE_DELAY_MS, isReducedMotion ? withTiming(1, PAGE_FADE_TIMING) : withSpring(1, SHEET_RESIZE_SPRING))
        );
    };

    const collapse = () => {
        phase.set(PageMotionPhaseEnum.COLLAPSING);
        pageProgress.set(
            withDelay(PREPARE_DELAY_MS, isReducedMotion ? withTiming(0, PAGE_FADE_TIMING) : withSpring(0, SHEET_RESIZE_SPRING))
        );
    };

    useAnimatedReaction(
        () => pageProgress.get(),
        progress => {
            if (phase.get() === PageMotionPhaseEnum.EXPANDING && progress === 1) {
                phase.set(PageMotionPhaseEnum.IDLE);
                scheduleOnRN(onSettled, true);
            } else if (phase.get() === PageMotionPhaseEnum.COLLAPSING && progress === 0) {
                phase.set(PageMotionPhaseEnum.IDLE);
                scheduleOnRN(onCollapsed);
            }
        }
    );

    return { expand, collapse };
};
