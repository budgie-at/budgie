import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_DAY_STATE_CLASS_NAME } from '../../constant/budget-day-state-class-name.constant';
import {
    BUDGET_DAY_STRIP_FILL_DURATION,
    BUDGET_DAY_STRIP_REDUCED_DURATION,
    BUDGET_DAY_STRIP_TODAY_DELAY,
    BUDGET_DAY_STRIP_TODAY_DURATION
} from '../../constant/budget-day-strip-motion.constant';
import { BudgetDayStateEnum } from '../../enum/budget-day-state.enum';

interface Props {
    readonly dayState: BudgetDayStateEnum;
    readonly fillDelay: number;
}

export const BudgetDayStripCell = ({ dayState, fillDelay }: Props) => {
    const reducedMotion = useReducedMotion();
    const cellClassName = cn('flex-1', 'rounded-[3px]', BUDGET_DAY_STATE_CLASS_NAME[dayState]);
    const motionFillEntering = FadeIn.delay(fillDelay).duration(BUDGET_DAY_STRIP_FILL_DURATION);
    const motionTodayEntering = FadeIn.delay(BUDGET_DAY_STRIP_TODAY_DELAY).duration(BUDGET_DAY_STRIP_TODAY_DURATION);
    const reducedEntering = FadeIn.duration(BUDGET_DAY_STRIP_REDUCED_DURATION);
    const fillEntering = reducedMotion ? reducedEntering : motionFillEntering;
    const todayEntering = reducedMotion ? reducedEntering : motionTodayEntering;
    const entering = dayState === BudgetDayStateEnum.TODAY ? todayEntering : fillEntering;

    if (dayState === BudgetDayStateEnum.FUTURE) {
        return <View className={cellClassName} />;
    }

    return <Animated.View entering={entering} className={cellClassName} />;
};
