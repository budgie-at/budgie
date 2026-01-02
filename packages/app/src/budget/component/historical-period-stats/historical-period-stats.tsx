import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { BudgetStatItem } from '../budget-stat-item/budget-stat-item';

interface Props {
    readonly categoriesCount: number;
    readonly overBudgetCount: number;
    readonly underBudgetCount: number;
}

export const HistoricalPeriodStats = ({ categoriesCount, overBudgetCount, underBudgetCount }: Props) => {
    const { t } = useLingui();
    const overBudgetStatus = overBudgetCount > 0 ? 'warning' : 'positive';

    return (
        <View className="flex-row justify-between">
            <BudgetStatItem value={categoriesCount} label={t`Categories`} status="neutral" />
            <BudgetStatItem value={overBudgetCount} label={t`Over`} status={overBudgetStatus} />
            <BudgetStatItem value={underBudgetCount} label={t`Under 50%`} status="positive" />
        </View>
    );
};
