import { Trans } from '@lingui/react/macro';
import { Fragment } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BudgetSelector } from '../../budget.selector';
import { getBudgetCategorySpent } from '../../utils/get-budget-category-spent.util';
import { BudgetWidgetCategoryChip } from '../budget-widget-category-chip/budget-widget-category-chip';

import type { BudgetCategorySpentInterface } from '@budgie/budget';
import type { BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

const WIDGET_CATEGORY_LIMITS_MAX = 3;

interface Props {
    readonly categoryLimits: readonly BudgetCategoryLimitEntityInterface[];
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
        <View className="flex-row flex-wrap items-center gap-x-sm gap-y-xs">
            {visibleCategoryLimits.map((limit, index) => (
                <Fragment key={limit.id}>
                    {isPositiveNumber(index) && <Text className="text-secondary-foreground text-sm">·</Text>}
                    <BudgetWidgetCategoryChip
                        categoryId={limit.categoryId}
                        limitAmount={limit.limitAmount}
                        spent={getBudgetCategorySpent(spentByCategoryMap, limit.categoryId)}
                        testID={BudgetSelector.WidgetCategoryRow(limit.categoryId)}
                        spentTestID={BudgetSelector.WidgetCategorySpentLabel(limit.categoryId)}
                    />
                </Fragment>
            ))}
            {isPositiveNumber(hiddenCategoryCount) && (
                <Text testID={BudgetSelector.WidgetMoreCategoriesLabel} className="text-secondary-foreground text-sm">
                    <Trans>+{hiddenCategoryCount} more</Trans>
                </Text>
            )}
        </View>
    );
};
