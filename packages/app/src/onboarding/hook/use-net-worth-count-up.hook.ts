import { useEffect, useState } from 'react';
import { Easing, runOnJS, useAnimatedReaction, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

const COUNT_UP_DURATION_MS = 900;
const COUNT_UP_STEPS = 24;

export const useNetWorthCountUp = (netWorth: number): number => {
    const reducedMotion = useReducedMotion();
    const [displayedNetWorth, setDisplayedNetWorth] = useState(0);
    const progress = useSharedValue(0);

    useEffect(() => {
        if (reducedMotion) {
            return;
        }

        progress.set(0);
        progress.set(withTiming(1, { duration: COUNT_UP_DURATION_MS, easing: Easing.out(Easing.cubic) }));
    }, [netWorth, reducedMotion, progress]);

    useAnimatedReaction(
        () => Math.round(progress.get() * COUNT_UP_STEPS),
        (currentStep, previousStep) => {
            if (reducedMotion || currentStep === previousStep) {
                return;
            }
            runOnJS(setDisplayedNetWorth)((currentStep / COUNT_UP_STEPS) * netWorth);
        },
        [netWorth, reducedMotion]
    );

    return reducedMotion ? netWorth : displayedNetWorth;
};
