import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_DAY_STATE_CLASS_NAME } from '../../constant/budget-day-state-class-name.constant';
import { BudgetDayStateEnum } from '../../enum/budget-day-state.enum';

export const BudgetDayStripKey = () => {
    const { t } = useLingui();
    const items = [
        { dayState: BudgetDayStateEnum.TODAY, label: t`Today` },
        { dayState: BudgetDayStateEnum.WITHIN, label: t`Within plan` },
        { dayState: BudgetDayStateEnum.OVER, label: t`Over plan` },
        { dayState: BudgetDayStateEnum.FAR_OVER, label: t`2× plan` }
    ];

    return (
        <View className="flex-row flex-wrap gap-x-xl gap-y-xs" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {items.map(({ dayState, label }) => (
                <View key={dayState} className="flex-row items-center gap-x-xs">
                    <View className={cn('w-[6px] rounded-[2px]', BUDGET_DAY_STATE_CLASS_NAME[dayState])} />
                    <Text className="text-xxs text-secondary-foreground">{label}</Text>
                </View>
            ))}
        </View>
    );
};
