import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion as useInitialReducedMotion } from 'react-native-reanimated';

export const useReducedMotion = (): boolean => {
    const [isReducedMotion, setIsReducedMotion] = useState(useInitialReducedMotion());

    useEffect(() => {
        const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsReducedMotion);

        void AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion);

        return () => {
            subscription.remove();
        };
    }, []);

    return isReducedMotion;
};
