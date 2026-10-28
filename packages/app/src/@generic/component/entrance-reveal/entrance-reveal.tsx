import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
    ENTRANCE_DISTANCE,
    ENTRANCE_DURATION,
    ENTRANCE_EASING,
    ENTRANCE_MAX_STEP,
    ENTRANCE_REDUCED_DURATION,
    ENTRANCE_STAGGER
} from '../../constant/entrance-motion.constant';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly step: number;
    readonly children: ReactNode;
    readonly className?: string;
}

const REDUCED_ENTERING = FadeIn.duration(ENTRANCE_REDUCED_DURATION);

export const EntranceReveal = ({ step, children, className }: Props) => {
    const reducedMotion = useReducedMotion();
    const delay = Math.min(step, ENTRANCE_MAX_STEP) * ENTRANCE_STAGGER;
    const motionEntering = FadeInDown.delay(delay)
        .duration(ENTRANCE_DURATION)
        .easing(ENTRANCE_EASING)
        .withInitialValues({
            opacity: 0,
            transform: [{ translateY: ENTRANCE_DISTANCE }]
        });
    const entering = reducedMotion ? REDUCED_ENTERING : motionEntering;

    return (
        <Animated.View entering={entering} className={className}>
            {children}
        </Animated.View>
    );
};
