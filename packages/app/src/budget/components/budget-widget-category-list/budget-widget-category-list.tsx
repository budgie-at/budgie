import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
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
    const isAmountProtected = useIsAmountProtected();
    const spentByCategoryMap = new Map(spentByCategory.map(entry => [entry.categoryId, entry.spent]));

    const sortedCategoryLimits = [...categoryLimits].sort((firstCategoryLimit, secondCategoryLimit) => {
        const firstSpent = getBudgetCategorySpent(spentByCategoryMap, firstCategoryLimit.categoryId);
        const secondSpent = getBudgetCategorySpent(spentByCategoryMap, secondCategoryLimit.categoryId);
        const firstRatio = isPositiveNumber(firstCategoryLimit.limitAmount) ? firstSpent / firstCategoryLimit.limitAmount : 0;
        const secondRatio = isPositiveNumber(secondCategoryLimit.limitAmount) ? secondSpent / secondCategoryLimit.limitAmount : 0;

        return secondRatio - firstRatio || secondSpent - firstSpent;
    });
    const visibleCategoryLimits = sortedCategoryLimits.slice(0, WIDGET_CATEGORY_LIMITS_MAX);
    const hiddenCategoryCount = categoryLimits.length - visibleCategoryLimits.length;

    if (isAmountProtected || !isNotEmptyArray(visibleCategoryLimits)) {
        return null;
    }

    return (
        <View className="gap-y-sm border-t-hairline border-surface-separator pt-md">
            <View className="flex-row items-center justify-between">
                <Text className="text-secondary-foreground text-xs font-semibold">
                    <Trans>Category limits</Trans>
                </Text>
                {isPositiveNumber(hiddenCategoryCount) && (
                    <View className="flex-row items-center gap-x-xxs">
                        <Text testID={BudgetSelector.WidgetMoreCategoriesLabel} className="text-secondary-foreground text-xs font-medium">
                            <Trans>+{hiddenCategoryCount} more</Trans>
                        </Text>
                        <Icon icon={UserIconNameEnum.ChevronRight} size={12} className="text-secondary-foreground" />
                    </View>
                )}
            </View>
            <View className="gap-y-xs">
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
            </View>
        </View>
    );
};
