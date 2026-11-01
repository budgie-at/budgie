import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

const FILL_DURATION = 220;

export const CategorizeInboxSessionProgress = () => {
    const { t } = useLingui();
    const reducedMotion = useReducedMotion();
    const { categorizedCount, remainingCount } = useCategorizeInboxContext();

    const total = categorizedCount + remainingCount;
    const percentage = isPositiveNumber(total) ? (categorizedCount / total) * 100 : 0;
    const width = useSharedValue(percentage);

    useEffect(() => {
        width.set(reducedMotion ? percentage : withTiming(percentage, { duration: FILL_DURATION }));
    }, [percentage, reducedMotion, width]);

    const fillStyle = useAnimatedStyle(() => ({ width: `${width.get()}%` }));
    const accessibilityValue = { min: 0, max: total, now: categorizedCount };

    if (!isPositiveNumber(total)) {
        return null;
    }

    return (
        <View
            className="mt-md h-[4px] w-[160px] overflow-hidden rounded-full bg-surface-fill"
            accessibilityRole="progressbar"
            accessibilityLabel={t`Sorted this session`}
            accessibilityValue={accessibilityValue}
        >
            <Animated.View className="h-full rounded-full bg-primary" style={fillStyle} />
        </View>
    );
};
