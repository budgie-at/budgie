import { useEffect } from 'react';
import {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

const FULL_OPACITY = 1;
const DIMMED_OPACITY = 0.6;
const HALF = 2;
const FILL_ANIMATION_DURATION = 300;
const PERCENT_DIVISOR = 100;
const POSITION_ABSOLUTE = 'absolute' as const;
const OVERFLOW_HIDDEN = 'hidden' as const;

interface Params {
    readonly percent: number;
    readonly iconSize: number;
    readonly pulsePeriodMs: number | null;
}

export const useAiSubsystemIconAnimations = ({ percent, iconSize, pulsePeriodMs }: Params) => {
    const reducedMotion = useReducedMotion();
    const pulseValue = useSharedValue(FULL_OPACITY);
    const fillHeight = useSharedValue((percent / PERCENT_DIVISOR) * iconSize);

    useEffect(() => {
        cancelAnimation(pulseValue);
        if (reducedMotion || !isDefined(pulsePeriodMs)) {
            pulseValue.value = FULL_OPACITY;

            return;
        }
        pulseValue.value = withRepeat(
            withTiming(DIMMED_OPACITY, { duration: pulsePeriodMs / HALF, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, [pulseValue, reducedMotion, pulsePeriodMs]);

    useEffect(() => {
        fillHeight.value = withTiming((percent / PERCENT_DIVISOR) * iconSize, { duration: FILL_ANIMATION_DURATION });
    }, [percent, iconSize, fillHeight]);

    const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseValue.value }));

    const clipStyle = useAnimatedStyle(() => ({
        position: POSITION_ABSOLUTE,
        bottom: 0,
        left: 0,
        right: 0,
        overflow: OVERFLOW_HIDDEN,
        height: fillHeight.value
    }));

    return { pulseStyle, clipStyle };
};
