import { View } from 'react-native';

import { STATUS_TONE_FILL_CLASS_NAME } from '../../../@generic/constant/status-tone-fill-class-name.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_DAY_STATE_CLASS_NAME } from '../../constant/budget-day-state-class-name.constant';
import { BudgetDayStateEnum } from '../../enum/budget-day-state.enum';

import type { BudgetPaceVariant } from '../../type/budget-pace-variant.type';

interface Props {
    readonly dayState: BudgetDayStateEnum;
    readonly tone: BudgetPaceVariant;
    readonly hasBill: boolean;
}

export const BudgetDayStripCell = ({ dayState, tone, hasBill }: Props) => {
    const isElapsed = dayState === BudgetDayStateEnum.ELAPSED;
    const cellClassName = cn(
        'h-[14px]',
        'w-full',
        'rounded-[3px]',
        BUDGET_DAY_STATE_CLASS_NAME[dayState],
        isElapsed && STATUS_TONE_FILL_CLASS_NAME[tone]
    );
    const billClassName = cn('h-[3px]', 'w-[3px]', 'rounded-full', hasBill ? 'bg-secondary-foreground' : 'bg-transparent');

    return (
        <View className="flex-1 items-center gap-y-xs">
            <View className={cellClassName} />
            <View className={billClassName} />
        </View>
    );
};
