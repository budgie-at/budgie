import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useReducedMotion } from './use-reduced-motion.hook';

import type { SharedValue } from 'react-native-reanimated';

const CARD_RADIUS = 36;
const KEYBOARD_GAP = 16;

export const useMorphingSheetStyle = (
    translateY: SharedValue<number>,
    visibleHeight: SharedValue<number>,
    baseBottom: number,
    frameHeight: number
) => {
    const { height: keyboardHeight, progress: keyboardProgress } = useReanimatedKeyboardAnimation();
    const isReducedMotion = useReducedMotion();

    const frameStaticStyle = {
        bottom: baseBottom,
        height: frameHeight,
        borderBottomLeftRadius: CARD_RADIUS,
        borderBottomRightRadius: CARD_RADIUS,
        borderCurve: 'continuous'
    } as const;

    const frameAnimatedStyle = useAnimatedStyle(() => {
        const keyboardLift = Math.abs(keyboardHeight.get()) + interpolate(keyboardProgress.get(), [0, 1], [0, KEYBOARD_GAP - baseBottom]);
        const presence = interpolate(translateY.get(), [0, Math.max(visibleHeight.get() + baseBottom, 1)], [1, 0], Extrapolation.CLAMP);

        return {
            opacity: isReducedMotion ? presence : 1,
            transform: [{ translateY: (isReducedMotion ? 0 : translateY.get()) - keyboardLift }]
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
