import { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { MORPHING_SHEET_KEYBOARD_TOP_CLEARANCE } from '../constant/morphing-sheet-keyboard.constant';

import { useMorphingSheetKeyboardLift } from './use-morphing-sheet-keyboard-lift.hook';
import { useReducedMotion } from './use-reduced-motion.hook';

import type { SharedValue } from 'react-native-reanimated';

const CARD_RADIUS = 36;

export const useMorphingSheetStyle = (
    translateY: SharedValue<number>,
    visibleHeight: SharedValue<number>,
    pageProgress: SharedValue<number>,
    frame: { readonly baseBottom: number; readonly frameHeight: number; readonly frameInset: number }
) => {
    const { baseBottom, frameHeight, frameInset } = frame;
    const keyboardLift = useMorphingSheetKeyboardLift(baseBottom);
    const isReducedMotion = useReducedMotion();
    const isDragging = useSharedValue(false);

    const frameStaticStyle = {
        bottom: baseBottom,
        left: frameInset,
        right: frameInset,
        height: frameHeight,
        borderBottomLeftRadius: CARD_RADIUS,
        borderBottomRightRadius: CARD_RADIUS,
        borderCurve: 'continuous'
    } as const;

    const frameAnimatedStyle = useAnimatedStyle(() => {
        const presence = interpolate(translateY.get(), [0, Math.max(visibleHeight.get() + baseBottom, 1)], [1, 0], Extrapolation.CLAMP);
        const progress = pageProgress.get();
        const maxLift = Math.max(0, frameHeight + MORPHING_SHEET_KEYBOARD_TOP_CLEARANCE - baseBottom - visibleHeight.get());
        const isOffsetFollowed = !isReducedMotion || isDragging.get();

        return {
            opacity: (isReducedMotion ? presence : 1) * (1 - progress * progress * (3 - 2 * progress)),
            transform: [{ translateY: (isOffsetFollowed ? translateY.get() : 0) - Math.min(keyboardLift.get(), maxLift) }]
        };
    });

    const cardStyle = useAnimatedStyle(() => ({
        height: frameHeight,
        borderTopLeftRadius: CARD_RADIUS,
        borderTopRightRadius: CARD_RADIUS,
        borderCurve: 'continuous',
        overflow: 'hidden',
        transform: [{ translateY: frameHeight - visibleHeight.get() }]
    }));

    return { frameStyle: [frameStaticStyle, frameAnimatedStyle], cardStyle, isDragging };
};
