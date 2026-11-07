import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { EASE_IN_OUT } from '../../../@generic/constant/motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

const FILL_DURATION = 280;
const FADE_DURATION = 180;

export const CategorizeInboxSessionProgress = () => {
    const { t } = useLingui();
    const reducedMotion = useReducedMotion();
    const { categorizedCount, remainingCount } = useCategorizeInboxContext();

    const total = categorizedCount + remainingCount;
    const percentage = isPositiveNumber(total) ? (categorizedCount / total) * 100 : 0;
    const visibleOpacity = isPositiveNumber(categorizedCount) ? 1 : 0;
    const width = useSharedValue(percentage);
    const opacity = useSharedValue(visibleOpacity);

    useEffect(() => {
        width.set(reducedMotion ? percentage : withTiming(percentage, { duration: FILL_DURATION, easing: EASE_IN_OUT }));
        opacity.set(reducedMotion ? visibleOpacity : withTiming(visibleOpacity, { duration: FADE_DURATION }));
    }, [percentage, visibleOpacity, reducedMotion, width, opacity]);

    const fillStyle = useAnimatedStyle(() => ({ width: `${width.get()}%` }));
    const trackStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
    const accessibilityValue = { min: 0, max: total, now: categorizedCount };

    if (!isPositiveNumber(total)) {
        return null;
    }

    return (
        <Animated.View
            className="mt-md h-[4px] w-[160px] overflow-hidden rounded-full bg-surface-disc"
            style={trackStyle}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={t`Sorted this session`}
            accessibilityValue={accessibilityValue}
        >
            <Animated.View className="h-full rounded-full bg-primary" style={fillStyle} />
        </Animated.View>
    );
};
