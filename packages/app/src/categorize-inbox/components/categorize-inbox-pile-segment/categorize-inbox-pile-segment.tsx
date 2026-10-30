import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ENTRANCE_EASING } from '../../../@generic/constant/entrance-motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly className: readonly string[];
    readonly share: number;
}

const PILE_DURATION = 520;

export const CategorizeInboxPileSegment = ({ className, share }: Props) => {
    const reducedMotion = useReducedMotion();
    const animatedShare = useSharedValue(share);

    const style = useAnimatedStyle(() => ({ borderCurve: 'continuous', flexBasis: 0, flexGrow: animatedShare.get() }));

    useEffect(() => {
        animatedShare.set(withTiming(share, { duration: reducedMotion ? 0 : PILE_DURATION, easing: ENTRANCE_EASING }));
    }, [animatedShare, reducedMotion, share]);

    return <Animated.View className={cn('h-full min-w-[6px] rounded-full', className)} style={style} />;
};
