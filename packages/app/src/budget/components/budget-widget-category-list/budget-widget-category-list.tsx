import { Trans } from '@lingui/react/macro';
import { Text, View, useWindowDimensions } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BudgetSelector } from '../../budget.selector';
import { getBudgetCategorySpent } from '../../utils/get-budget-category-spent.util';
import { selectBudgetWidgetChips } from '../../utils/select-budget-widget-chips.util';
import { BudgetWidgetCategoryChip } from '../budget-widget-category-chip/budget-widget-category-chip';

import type { BudgetCategorySpentInterface, BudgetEffectiveCategoryLimitInterface } from '@budgie/budget';

const WIDGET_CHIPS_MAX = 2;
const LARGE_TEXT_FONT_SCALE = 1.3;

interface Props {
    readonly categoryLimits: readonly BudgetEffectiveCategoryLimitInterface[];
    readonly spentByCategory: readonly BudgetCategorySpentInterface[];
}

export const BudgetWidgetCategoryList = ({ categoryLimits, spentByCategory }: Props) => {
    const { fontScale } = useWindowDimensions();
    const spentByCategoryMap = new Map(spentByCategory.map(entry => [entry.categoryId, entry.spent]));
    const maxChips = fontScale > LARGE_TEXT_FONT_SCALE ? 1 : WIDGET_CHIPS_MAX;
    const { visible: visibleCategoryLimits, hiddenCount: hiddenCategoryCount } = selectBudgetWidgetChips(
        categoryLimits,
        spentByCategoryMap,
        maxChips
    );

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
