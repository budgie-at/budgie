import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BudgetSelector } from '../../budget.selector';
import { getBudgetCategorySpent } from '../../utils/get-budget-category-spent.util';
import { BudgetWidgetCategoryChip } from '../budget-widget-category-chip/budget-widget-category-chip';

import type { BudgetCategorySpentInterface, BudgetEffectiveCategoryLimitInterface } from '@budgie/budget';

const WIDGET_CATEGORY_LIMITS_MAX = 3;

interface Props {
    readonly categoryLimits: readonly BudgetEffectiveCategoryLimitInterface[];
    readonly spentByCategory: readonly BudgetCategorySpentInterface[];
}

export const BudgetWidgetCategoryList = ({ categoryLimits, spentByCategory }: Props) => {
    const spentByCategoryMap = new Map(spentByCategory.map(entry => [entry.categoryId, entry.spent]));

    const sortedCategoryLimits = [...categoryLimits].sort((firstCategoryLimit, secondCategoryLimit) => {
        const firstSpent = getBudgetCategorySpent(spentByCategoryMap, firstCategoryLimit.categoryId);
        const secondSpent = getBudgetCategorySpent(spentByCategoryMap, secondCategoryLimit.categoryId);

        return secondSpent - firstSpent;
    });
    const visibleCategoryLimits = sortedCategoryLimits.slice(0, WIDGET_CATEGORY_LIMITS_MAX);
    const hiddenCategoryCount = categoryLimits.length - visibleCategoryLimits.length;

    if (!isNotEmptyArray(visibleCategoryLimits)) {
        return null;
    }

    return (
        <View className="flex-row items-center gap-x-lg overflow-hidden">
            {visibleCategoryLimits.map(limit => (
                <BudgetWidgetCategoryChip
                    key={limit.categoryId}
                    categoryId={limit.categoryId}
                    limitAmount={limit.limitAmount}
                    spent={getBudgetCategorySpent(spentByCategoryMap, limit.categoryId)}
                    testID={BudgetSelector.WidgetCategoryRow(limit.categoryId)}
                    spentTestID={BudgetSelector.WidgetCategorySpentLabel(limit.categoryId)}
                />
            ))}
            {isPositiveNumber(hiddenCategoryCount) && (
                <Text testID={BudgetSelector.WidgetMoreCategoriesLabel} className="shrink-0 text-secondary-foreground text-xs">
                    <Trans>+{hiddenCategoryCount} more</Trans>
                </Text>
            )}
        </View>
    );
};
