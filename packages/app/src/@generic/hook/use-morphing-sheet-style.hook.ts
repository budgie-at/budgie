import { Extrapolation, interpolate, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

import { MORPHING_SHEET_KEYBOARD_TOP_CLEARANCE } from '../constant/morphing-sheet-keyboard.constant';
import { MORPHING_SHEET_RADIUS } from '../constant/morphing-sheet-radius.constant';

import { useReducedMotion } from './use-reduced-motion.hook';

import type { useMorphingSheetMotion } from './use-morphing-sheet-motion.hook';
import type { SharedValue } from 'react-native-reanimated';

export const useMorphingSheetStyle = (
    motion: Pick<ReturnType<typeof useMorphingSheetMotion>, 'translateY' | 'visibleHeight' | 'pageProgress' | 'isDragging' | 'frame'>,
    keyboardLift: SharedValue<number>
) => {
    const { translateY, visibleHeight, pageProgress, isDragging, frame } = motion;
    const { baseBottom, frameHeight, frameInset } = frame;
    const isReducedMotion = useReducedMotion();

    const frameStaticStyle = {
        bottom: baseBottom,
        left: frameInset,
        right: frameInset,
        height: frameHeight,
        borderBottomLeftRadius: MORPHING_SHEET_RADIUS,
        borderBottomRightRadius: MORPHING_SHEET_RADIUS,
        borderCurve: 'continuous'
    } as const;

    const presence = useDerivedValue(() =>
        interpolate(translateY.get(), [0, Math.max(visibleHeight.get() + baseBottom, 1)], [1, 0], Extrapolation.CLAMP)
    );

    const frameAnimatedStyle = useAnimatedStyle(() => {
        const progress = pageProgress.get();
        const maxLift = Math.max(0, frameHeight + MORPHING_SHEET_KEYBOARD_TOP_CLEARANCE - baseBottom - visibleHeight.get());
        const isOffsetFollowed = !isReducedMotion || isDragging.get();

        return {
            opacity: (isReducedMotion ? presence.get() : 1) * (1 - progress * progress * (3 - 2 * progress)),
            transform: [{ translateY: (isOffsetFollowed ? translateY.get() : 0) - Math.min(keyboardLift.get(), maxLift) }]
        };
    });

    const cardStyle = useAnimatedStyle(() => ({
        height: frameHeight,
        borderTopLeftRadius: MORPHING_SHEET_RADIUS,
        borderTopRightRadius: MORPHING_SHEET_RADIUS,
        borderCurve: 'continuous',
        overflow: 'hidden',
        transform: [{ translateY: frameHeight - visibleHeight.get() }]
    }));

    return { frameStyle: [frameStaticStyle, frameAnimatedStyle], cardStyle, presence };
};
