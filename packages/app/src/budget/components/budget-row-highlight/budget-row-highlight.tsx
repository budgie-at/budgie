import { useEffect, useEffectEvent } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { ENTRANCE_REDUCED_DURATION } from '../../../@generic/constant/entrance-motion.constant';
import { EASE_OUT } from '../../../@generic/constant/motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useBudgetHighlightContext } from '../../context/budget-highlight.context';

import type { RefObject } from 'react';
import type { View } from 'react-native';

interface Props {
    readonly rowRef: RefObject<View | null>;
    readonly isHighlighted: boolean;
}

const HIGHLIGHT_FADE_DURATION = 240;
const HIGHLIGHT_HOLD_DURATION = 1200;

export const BudgetRowHighlight = ({ rowRef, isHighlighted }: Props) => {
    const { target, reveal } = useBudgetHighlightContext();
    const reducedMotion = useReducedMotion();
    const highlightProgress = useSharedValue(0);
    const highlightStyle = useAnimatedStyle(() => ({ opacity: highlightProgress.get() }));

    const handleHighlight = useEffectEvent(() => {
        const fadeDuration = reducedMotion ? ENTRANCE_REDUCED_DURATION : HIGHLIGHT_FADE_DURATION;

        highlightProgress.set(
            withSequence(
                withTiming(1, { duration: fadeDuration, easing: EASE_OUT }),
                withDelay(HIGHLIGHT_HOLD_DURATION, withTiming(0, { duration: fadeDuration, easing: EASE_OUT }))
            )
        );

        if (isDefined(rowRef.current)) {
            reveal(rowRef.current);
        }
    });

    useEffect(() => {
        if (isHighlighted) {
            handleHighlight();
        }
    }, [target, isHighlighted]);

    return (
        <Animated.View
            pointerEvents="none"
            style={highlightStyle}
            className="absolute -inset-x-2 -inset-y-1.5 rounded-2xl bg-warning-background"
        />
    );
};
