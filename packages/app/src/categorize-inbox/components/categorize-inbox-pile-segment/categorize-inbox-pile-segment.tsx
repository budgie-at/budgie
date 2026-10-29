import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ENTRANCE_EASING } from '../../../@generic/constant/entrance-motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly className: string;
    readonly offset: number;
    readonly share: number;
}

const PERCENT_MULTIPLIER = 100;
const PILE_DURATION = 520;

export const CategorizeInboxPileSegment = ({ className, offset, share }: Props) => {
    const reducedMotion = useReducedMotion();
    const animatedOffset = useSharedValue(offset);
    const animatedShare = useSharedValue(share);

    const style = useAnimatedStyle(() => ({
        transformOrigin: 'left',
        transform: [{ translateX: `${animatedOffset.get() * PERCENT_MULTIPLIER}%` }, { scaleX: animatedShare.get() }]
    }));

    useEffect(() => {
        const timing = { duration: reducedMotion ? 0 : PILE_DURATION, easing: ENTRANCE_EASING };

        animatedOffset.set(withTiming(offset, timing));
        animatedShare.set(withTiming(share, timing));
    }, [animatedOffset, animatedShare, offset, reducedMotion, share]);

    return <Animated.View className={cn('absolute inset-0', className)} style={style} />;
};
