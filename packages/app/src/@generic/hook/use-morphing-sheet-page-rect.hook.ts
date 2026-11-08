import { useWindowDimensions } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { useReducedMotion } from './use-reduced-motion.hook';

import type { MorphingSheetPageRectInterface } from '../interface/morphing-sheet-page-rect.interface';
import type { SharedValue } from 'react-native-reanimated';

const CARD_INSET = 16;
const BACKDROP_FADE_IN_RATE = 10;

export const useMorphingSheetPageRect = (
    pageProgress: SharedValue<number>,
    visibleHeight: SharedValue<number>,
    frozenLift: SharedValue<number>,
    baseBottom: number
) => {
    const { height: windowHeight } = useWindowDimensions();
    const isReducedMotion = useReducedMotion();

    return useDerivedValue<MorphingSheetPageRectInterface>(() => {
        const progress = pageProgress.get();
        const remaining = isReducedMotion ? 0 : 1 - progress;
        const cardBottom = baseBottom + frozenLift.get();

        return {
            left: CARD_INSET * remaining,
            right: CARD_INSET * remaining,
            top: (windowHeight - cardBottom - visibleHeight.get()) * remaining,
            bottom: cardBottom * remaining,
            opacity: isReducedMotion ? progress : Math.min(progress * BACKDROP_FADE_IN_RATE, 1)
        };
    });
};
