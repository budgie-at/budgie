import { useEffect } from 'react';
import { Easing, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

const FILL_DURATION = 400;
const FILL_EASING_X1 = 0.77;
const FILL_EASING_Y1 = 0;
const FILL_EASING_X2 = 0.175;
const FILL_EASING_Y2 = 1;
const FILL_EASING = Easing.bezier(FILL_EASING_X1, FILL_EASING_Y1, FILL_EASING_X2, FILL_EASING_Y2);

export const useDebtProgressFill = (percentage: number) => {
    const reducedMotion = useReducedMotion();
    const progress = useSharedValue(percentage);

    useEffect(() => {
        progress.set(reducedMotion ? percentage : withTiming(percentage, { duration: FILL_DURATION, easing: FILL_EASING }));
    }, [percentage, reducedMotion, progress]);

    return progress;
};
