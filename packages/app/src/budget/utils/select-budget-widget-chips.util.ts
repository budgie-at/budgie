import { isPositiveNumber } from '@rnw-community/shared';

import { getBudgetCategorySpent } from './get-budget-category-spent.util';

import type { BudgetWidgetChipSelectionInterface } from '../interface/budget-widget-chip-selection.interface';
import type { BudgetEffectiveCategoryLimitInterface } from '@budgie/budget';

export const selectBudgetWidgetChips = (
    categoryLimits: readonly BudgetEffectiveCategoryLimitInterface[],
    spentByCategory: ReadonlyMap<number, number>,
    maxChips: number
): BudgetWidgetChipSelectionInterface => {
    const ratioOf = (limit: BudgetEffectiveCategoryLimitInterface) => {
        const spent = getBudgetCategorySpent(spentByCategory, limit.categoryId);

        return isPositiveNumber(limit.limitAmount) ? spent / limit.limitAmount : spent;
    };
    const ranked = [...categoryLimits].sort((first, second) => ratioOf(second) - ratioOf(first));
    const visible = ranked.slice(0, maxChips);

    return { visible, hiddenCount: categoryLimits.length - visible.length };
};
