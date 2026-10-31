import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_DAY_STATE_CLASS_NAME } from '../../constant/budget-day-state-class-name.constant';
import { BudgetDayStateEnum } from '../../enum/budget-day-state.enum';

interface Props {
    readonly dayStates: ReadonlySet<BudgetDayStateEnum>;
}

export const BudgetDayStripKey = ({ dayStates }: Props) => {
    const { t } = useLingui();
    const items = [
        { dayState: BudgetDayStateEnum.TODAY, label: t`Today` },
        { dayState: BudgetDayStateEnum.WITHIN, label: t`Within plan` },
        { dayState: BudgetDayStateEnum.OVER, label: t`Over plan` },
        { dayState: BudgetDayStateEnum.FAR_OVER, label: t`2× plan` }
    ].filter(item => item.dayState === BudgetDayStateEnum.TODAY || dayStates.has(item.dayState));

    return (
        <View
            className="flex-row flex-wrap items-center gap-x-md gap-y-xxs"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {items.map(({ dayState, label }) => (
                <View key={dayState} className="flex-row items-center gap-x-xxs">
                    <View className={cn('w-[4px] rounded-[1px]', BUDGET_DAY_STATE_CLASS_NAME[dayState], 'h-[8px]')} />
                    <Text className="text-xxs text-secondary-foreground">{label}</Text>
                </View>
            ))}
        </View>
    );
};
