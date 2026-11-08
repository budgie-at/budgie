import { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useMorphingSheetKeyboardLift } from './use-morphing-sheet-keyboard-lift.hook';
import { useReducedMotion } from './use-reduced-motion.hook';

import type { SharedValue } from 'react-native-reanimated';

const CARD_RADIUS = 36;

export const useMorphingSheetStyle = (
    translateY: SharedValue<number>,
    visibleHeight: SharedValue<number>,
    pageProgress: SharedValue<number>,
    frame: { readonly baseBottom: number; readonly frameHeight: number }
) => {
    const { baseBottom, frameHeight } = frame;
    const keyboardLift = useMorphingSheetKeyboardLift(baseBottom);
    const isReducedMotion = useReducedMotion();

    const frameStaticStyle = {
        bottom: baseBottom,
        height: frameHeight,
        borderBottomLeftRadius: CARD_RADIUS,
        borderBottomRightRadius: CARD_RADIUS,
        borderCurve: 'continuous'
    } as const;

    const frameAnimatedStyle = useAnimatedStyle(() => {
        const presence = interpolate(translateY.get(), [0, Math.max(visibleHeight.get() + baseBottom, 1)], [1, 0], Extrapolation.CLAMP);
        const progress = pageProgress.get();

        return {
            opacity: (isReducedMotion ? presence : 1) * (1 - progress * progress * (3 - 2 * progress)),
            transform: [{ translateY: (isReducedMotion ? 0 : translateY.get()) - keyboardLift.get() }]
        };
    });

    const cardStyle = useAnimatedStyle(() => ({
        height: frameHeight,
        borderTopLeftRadius: CARD_RADIUS,
        borderTopRightRadius: CARD_RADIUS,
        borderCurve: 'continuous',
        transform: [{ translateY: frameHeight - visibleHeight.get() }]
    }));

    return { frameStyle: [frameStaticStyle, frameAnimatedStyle], cardStyle };
};
