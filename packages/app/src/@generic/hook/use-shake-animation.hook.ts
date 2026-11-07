import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { EASE_IN_OUT } from '../constant/motion.constant';

import { useReducedMotion } from './use-reduced-motion.hook';

const SHAKE_FIRST_OFFSET = 10;
const SHAKE_SECOND_OFFSET = -8;
const SHAKE_THIRD_OFFSET = 6;
const SHAKE_FOURTH_OFFSET = -3;
const SHAKE_DURATION = 50;
const SHAKE_TIMING = { duration: SHAKE_DURATION, easing: EASE_IN_OUT };

export const useShakeAnimation = () => {
    const translateX = useSharedValue(0);
    const reducedMotion = useReducedMotion();

    const shake = () => {
        if (reducedMotion) {
            return;
        }

        translateX.set(
            withSequence(
                withTiming(SHAKE_FIRST_OFFSET, SHAKE_TIMING),
                withTiming(SHAKE_SECOND_OFFSET, SHAKE_TIMING),
                withTiming(SHAKE_THIRD_OFFSET, SHAKE_TIMING),
                withTiming(SHAKE_FOURTH_OFFSET, SHAKE_TIMING),
                withTiming(0, SHAKE_TIMING)
            )
        );
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.get() }]
    }));

    return { shake, animatedStyle };
};
