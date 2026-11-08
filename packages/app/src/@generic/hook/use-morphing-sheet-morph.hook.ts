import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { useReducedMotion } from './use-reduced-motion.hook';

import type { SharedValue } from 'react-native-reanimated';

const MIN_PROGRESS_DELTA = 8;

export const useMorphingSheetMorph = (visibleHeight: SharedValue<number>) => {
    const isReducedMotion = useReducedMotion();
    const smallHeight = useSharedValue(0);
    const largeHeight = useSharedValue(0);
    const fromStep = useSharedValue('');
    const toStep = useSharedValue('');
    const tallerStep = useSharedValue('');
    const isProgressDriven = useSharedValue(false);

    const progress = useDerivedValue(() => {
        const small = smallHeight.get();
        const range = Math.max(largeHeight.get() - small, 1);

        return Math.min(Math.max((visibleHeight.get() - small) / range, 0), 1);
    });

    const beginMorph = (fromKey: string, toKey: string, fromHeight: number, toHeight: number) => {
        smallHeight.set(Math.min(fromHeight, toHeight));
        largeHeight.set(Math.max(fromHeight, toHeight));
        fromStep.set(fromKey);
        toStep.set(toKey);
        tallerStep.set(toHeight >= fromHeight ? toKey : fromKey);
        isProgressDriven.set(!isReducedMotion && Math.abs(toHeight - fromHeight) >= MIN_PROGRESS_DELTA);
    };

    return { morph: { progress, fromStep, toStep, tallerStep, isProgressDriven }, beginMorph };
};
