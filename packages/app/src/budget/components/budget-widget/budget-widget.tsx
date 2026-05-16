import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { BudgetSelector } from '../../budget.selector';
import { useGetActiveBudgetQuery } from '../../query/use-get-active-budget.query';
import { useGetBudgetCategoryLimitsQuery } from '../../query/use-get-budget-category-limits.query';
import { useGetBudgetSpentQuery } from '../../query/use-get-budget-spent.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { BudgetCategoryLimitRow } from '../budget-category-limit-row/budget-category-limit-row';
import { BudgetEmptyState } from '../budget-empty-state/budget-empty-state';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

const WIDGET_CATEGORY_LIMITS_MAX = 6;

const handleNavigate = () => void router.push('/budget');

export const BudgetWidget = () => {
    const { t } = useLingui();
    const isEnabled = useSetting('isBudgetWidgetEnabled');
    const { budget } = useGetActiveBudgetQuery();
    const { spent } = useGetBudgetSpentQuery(budget);
    const { categoryLimits } = useGetBudgetCategoryLimitsQuery(isDefined(budget) ? budget.id : null);

    if (!isDefined(budget)) {
        return <BudgetEmptyState testID={BudgetSelector.WidgetEmptyState} />;
    }

    if (!isEnabled) {
        return null;
    }

    const dateLabel = formatBudgetPeriodLabel(budget, 'short');
    const headline = t`Monthly budget`;
    const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));
    const visibleCategoryLimits = categoryLimits.slice(0, WIDGET_CATEGORY_LIMITS_MAX);
    const hiddenCategoryCount = categoryLimits.length - visibleCategoryLimits.length;

    return (
        <Card testID={BudgetSelector.WidgetCard} variant="ghost" onPress={handleNavigate} className="gap-y-lg">
            <View className="flex-row items-center justify-between">
                <Text className="text-primary font-semibold text-md">{headline}</Text>
                <Text className="text-secondary-foreground text-sm">{dateLabel}</Text>
            </View>

            <BudgetProgressBar spent={spent.spentOverall} limit={budget.overallLimit} spentTestID={BudgetSelector.WidgetSpentLabel} />

            {isNotEmptyArray(visibleCategoryLimits) && (
                <View className="gap-y-md pt-md">
                    {visibleCategoryLimits.map(limit => (
                        <BudgetCategoryLimitRow
                            key={limit.id}
                            categoryId={limit.categoryId}
                            limitAmount={limit.limitAmount}
                            spent={spentByCategoryMap.get(limit.categoryId) ?? 0}
                            testID={BudgetSelector.WidgetCategoryRow(limit.categoryId)}
                        />
                    ))}
                    {hiddenCategoryCount > 0 && (
                        <Text
                            testID={BudgetSelector.WidgetMoreCategoriesLabel}
                            className="text-secondary-foreground text-sm text-center pt-xs"
                        >
                            {t`+${hiddenCategoryCount} more`}
                        </Text>
                    )}
                </View>
            )}
        </Card>
    );
};
