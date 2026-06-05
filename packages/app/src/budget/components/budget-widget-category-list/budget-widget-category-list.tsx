import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BudgetSelector } from '../../budget.selector';
import { BudgetCategoryLimitRow } from '../budget-category-limit-row/budget-category-limit-row';

import type { BudgetCategorySpentInterface } from '../../interface/budget-category-spent.interface';
import type { BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

const WIDGET_CATEGORY_LIMITS_MAX = 3;

interface Props {
    readonly categoryLimits: readonly BudgetCategoryLimitEntityInterface[];
    readonly spentByCategory: readonly BudgetCategorySpentInterface[];
}

export const BudgetWidgetCategoryList = ({ categoryLimits, spentByCategory }: Props) => {
    const spentByCategoryMap = new Map(spentByCategory.map(entry => [entry.categoryId, entry.spent]));
    const sortedCategoryLimits = [...categoryLimits].sort((firstCategoryLimit, secondCategoryLimit) => {
        const firstSpent = spentByCategoryMap.get(firstCategoryLimit.categoryId) ?? 0;
        const secondSpent = spentByCategoryMap.get(secondCategoryLimit.categoryId) ?? 0;

        return secondSpent - firstSpent;
    });
    const visibleCategoryLimits = sortedCategoryLimits.slice(0, WIDGET_CATEGORY_LIMITS_MAX);
    const hiddenCategoryCount = categoryLimits.length - visibleCategoryLimits.length;

    if (!isNotEmptyArray(visibleCategoryLimits)) {
        return null;
    }

    return (
        <View className="gap-y-md pt-md">
            {visibleCategoryLimits.map(limit => (
                <BudgetCategoryLimitRow
                    key={limit.id}
                    categoryId={limit.categoryId}
                    limitAmount={limit.limitAmount}
                    spent={spentByCategoryMap.get(limit.categoryId) ?? 0}
                    testID={BudgetSelector.WidgetCategoryRow(limit.categoryId)}
                    spentTestID={BudgetSelector.WidgetCategorySpentLabel(limit.categoryId)}
                />
            ))}
            {isPositiveNumber(hiddenCategoryCount) && (
                <Text testID={BudgetSelector.WidgetMoreCategoriesLabel} className="text-secondary-foreground text-sm text-center pt-xs">
                    <Trans>+{hiddenCategoryCount} more</Trans>
                </Text>
            )}
        </View>
    );
};
