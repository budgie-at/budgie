import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { BudgetSelector } from '../../budget.selector';
import { useGetActiveBudgetQuery } from '../../query/use-get-active-budget.query';
import { useGetBudgetCategoryLimitsQuery } from '../../query/use-get-budget-category-limits.query';
import { useGetBudgetSpentQuery } from '../../query/use-get-budget-spent.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { BudgetCategoryLimitRow } from '../budget-category-limit-row/budget-category-limit-row';
import { BudgetEmptyState } from '../budget-empty-state/budget-empty-state';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

const handleNavigate = () => void router.push('/budget');

export const BudgetWidget = () => {
    const { t } = useLingui();
    const { budget } = useGetActiveBudgetQuery();
    const { spent } = useGetBudgetSpentQuery(budget);
    const { categoryLimits } = useGetBudgetCategoryLimitsQuery(isDefined(budget) ? budget.id : null);

    if (!isDefined(budget)) {
        return <BudgetEmptyState testID={BudgetSelector.WidgetEmptyState} />;
    }

    const dateLabel = formatBudgetPeriodLabel(budget, 'short');
    const headline = t`Monthly budget`;
    const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));
    const hasCategoryLimits = isNotEmptyArray(categoryLimits);

    return (
        <Card testID={BudgetSelector.WidgetCard} variant="ghost" onPress={handleNavigate} className="gap-y-lg">
            <View className="flex-row items-center justify-between">
                <Text className="text-primary font-semibold text-md">{headline}</Text>
                <Text className="text-secondary-foreground text-sm">{dateLabel}</Text>
            </View>

            <BudgetProgressBar spent={spent.spentOverall} limit={budget.overallLimit} spentTestID={BudgetSelector.WidgetSpentLabel} />

            {hasCategoryLimits && (
                <View className="gap-y-md pt-md">
                    {categoryLimits.map(limit => (
                        <BudgetCategoryLimitRow
                            key={limit.id}
                            categoryId={limit.categoryId}
                            limitAmount={limit.limitAmount}
                            spent={spentByCategoryMap.get(limit.categoryId) ?? 0}
                            testID={BudgetSelector.WidgetCategoryRow(limit.categoryId)}
                        />
                    ))}
                </View>
            )}
        </Card>
    );
};
