import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_LIMIT_BAR_SPRING, BUDGET_LIMIT_BAR_STAGGER } from '../../constant/budget-limit-bar-motion.constant';

import type { BudgetPaceVariant } from '../../type/budget-pace-variant.type';

interface Props {
    readonly spent: number;
    readonly limit: number;
    readonly tone: BudgetPaceVariant;
    readonly elapsedFraction?: number;
    readonly staggerIndex?: number;
}

const PERCENT_MULTIPLIER = 100;
const BAR_FILL_CLASS_NAME: Record<BudgetPaceVariant, string> = {
    positive: 'bg-primary/85',
    warning: 'bg-warning-fill',
    destructive: 'bg-destructive-fill'
};

export const BudgetLimitBar = ({ spent, limit, tone, elapsedFraction, staggerIndex = 0 }: Props) => {
    const reducedMotion = useReducedMotion();
    const ratio = Math.max(isPositiveNumber(limit) ? Math.min(spent / limit, 1) : Number(isPositiveNumber(spent)), 0);
    const progress = useSharedValue(0);
    const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * PERCENT_MULTIPLIER}%` }));
    const todayStart: `${number}%` = `${(elapsedFraction ?? 0) * PERCENT_MULTIPLIER}%`;
    const todayStyle = { start: todayStart };

    useEffect(() => {
        progress.set(
            reducedMotion ? ratio : withDelay(staggerIndex * BUDGET_LIMIT_BAR_STAGGER, withSpring(ratio, BUDGET_LIMIT_BAR_SPRING))
        );
    }, [progress, ratio, reducedMotion, staggerIndex]);

    return (
        <View className="h-[11px] justify-center">
            <View className="h-[3px] overflow-hidden rounded-full bg-secondary-corner">
                <Animated.View className={cn('h-full rounded-full', BAR_FILL_CLASS_NAME[tone])} style={fillStyle} />
            </View>
            {isDefined(elapsedFraction) ? (
                <View className="absolute top-0 h-[11px] w-[1.5px] -ms-[0.75px] rounded-full bg-primary" style={todayStyle} />
            ) : null}
        </View>
    );
};
