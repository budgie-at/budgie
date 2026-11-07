import { useEffect } from 'react';
import { useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { ENTRANCE_STAGGER } from '../constant/entrance-motion.constant';
import { GROW_BAR_SPRING } from '../constant/grow-bar-motion.constant';

import { useReducedMotion } from './use-reduced-motion.hook';

export const useGrowProgress = (ratio: number, staggerIndex: number) => {
    const reducedMotion = useReducedMotion();
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.set(reducedMotion ? ratio : withDelay(staggerIndex * ENTRANCE_STAGGER, withSpring(ratio, GROW_BAR_SPRING)));
    }, [progress, ratio, reducedMotion, staggerIndex]);

    return progress;
};
