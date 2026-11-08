import { useWindowDimensions } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { useMorphingSheetFrame } from './use-morphing-sheet-frame.hook';
import { useReducedMotion } from './use-reduced-motion.hook';

import type { MorphingSheetPageRectInterface } from '../interface/morphing-sheet-page-rect.interface';
import type { SharedValue } from 'react-native-reanimated';

const BACKDROP_FADE_IN_RATE = 10;

export const useMorphingSheetPageRect = (
    pageProgress: SharedValue<number>,
    visibleHeight: SharedValue<number>,
    frozenLift: SharedValue<number>,
    presence: SharedValue<number>
) => {
    const { height: windowHeight } = useWindowDimensions();
    const { baseBottom, frameInset } = useMorphingSheetFrame();
    const isReducedMotion = useReducedMotion();

    return useDerivedValue<MorphingSheetPageRectInterface>(() => {
        const progress = pageProgress.get();
        const remaining = isReducedMotion ? 0 : 1 - progress;
        const cardBottom = baseBottom + frozenLift.get();

        return {
            left: frameInset * remaining,
            right: frameInset * remaining,
            top: (windowHeight - cardBottom - visibleHeight.get()) * remaining,
            bottom: cardBottom * remaining,
            opacity: presence.get() * (isReducedMotion ? progress : Math.min(progress * BACKDROP_FADE_IN_RATE, 1))
        };
    });
};
