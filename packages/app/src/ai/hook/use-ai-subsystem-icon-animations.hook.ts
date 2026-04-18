import { useEffect } from 'react';
import {
    Easing,
    SharedValue,
    cancelAnimation,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

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
        if (reducedMotion || pulsePeriodMs === null) {
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

const OPACITY_THRESHOLD = 0.01;

interface HoldRingParams {
    readonly holdProgress: SharedValue<number>;
    readonly ringCircumference: number;
    readonly ringOffset: number;
}

export const useAiSubsystemIconHoldRing = ({ holdProgress, ringCircumference, ringOffset }: HoldRingParams) => {
    const holdRingStyle = useAnimatedStyle(() => ({
        opacity: holdProgress.get() > OPACITY_THRESHOLD ? FULL_OPACITY : 0,
        position: POSITION_ABSOLUTE,
        top: -ringOffset,
        left: -ringOffset
    }));

    return { holdRingStyle, strokeDashoffset: (progress: number) => ringCircumference * (1 - progress) };
};
