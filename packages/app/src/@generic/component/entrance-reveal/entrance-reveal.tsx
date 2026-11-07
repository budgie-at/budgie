import Animated, { FadeIn, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import {
    ENTRANCE_DISTANCE,
    ENTRANCE_MAX_STEP,
    ENTRANCE_OPACITY_DURATION,
    ENTRANCE_REDUCED_DURATION,
    ENTRANCE_SPRING,
    ENTRANCE_STAGGER
} from '../../constant/entrance-motion.constant';
import { EASE_OUT } from '../../constant/motion.constant';
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

    const motionEntering = () => {
        'worklet';

        return {
            initialValues: { opacity: 0, transform: [{ translateY: ENTRANCE_DISTANCE }] },
            animations: {
                opacity: withDelay(delay, withTiming(1, { duration: ENTRANCE_OPACITY_DURATION, easing: EASE_OUT })),
                transform: [{ translateY: withDelay(delay, withSpring(0, ENTRANCE_SPRING)) }]
            }
        };
    };
    const entering = reducedMotion ? REDUCED_ENTERING : motionEntering;

    return (
        <Animated.View entering={entering} className={className}>
            {children}
        </Animated.View>
    );
};
