import { isPositiveNumber } from '@rnw-community/shared';

import { BudgetAlertScopeEnum } from '../enum/budget-alert-scope.enum';

import type { BudgetSpentInterface } from '../../spent/interface/budget-spent.interface';
import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetAlertBudgetInterface } from '../interface/budget-alert-budget.interface';
import type { BudgetAlertTriggerInterface } from '../interface/budget-alert-trigger.interface';

const BUDGET_ALERT_THRESHOLDS = [80, 100] as const;

const crossesThreshold = (spent: number, limit: number, thresholdPercent: number): boolean =>
    isPositiveNumber(limit) && spent * 100 >= limit * thresholdPercent;

const computeOverallTriggers = (budget: BudgetAlertBudgetInterface, spent: BudgetSpentInterface): BudgetAlertTriggerInterface[] =>
    BUDGET_ALERT_THRESHOLDS.filter(threshold => crossesThreshold(spent.spentOverall, budget.overallLimit, threshold)).map(threshold => ({
        scope: BudgetAlertScopeEnum.OVERALL,
        categoryId: null,
        threshold
    }));

const computeCategoryTriggers = (
    spent: BudgetSpentInterface,
    categoryLimits: readonly BudgetCategoryLimitInputInterface[]
): BudgetAlertTriggerInterface[] => {
    const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));

    return categoryLimits.flatMap(limit => {
        if (!isPositiveNumber(limit.limitAmount)) {
            return [];
        }

        const spentAmount = spentByCategoryMap.get(limit.categoryId) ?? 0;

        return BUDGET_ALERT_THRESHOLDS.filter(threshold => crossesThreshold(spentAmount, limit.limitAmount, threshold)).map(threshold => ({
            scope: BudgetAlertScopeEnum.CATEGORY,
            categoryId: limit.categoryId,
            threshold
        }));
    });
};

const computeOtherTriggers = (
    budget: BudgetAlertBudgetInterface,
    spent: BudgetSpentInterface,
    categoryLimits: readonly BudgetCategoryLimitInputInterface[]
): BudgetAlertTriggerInterface[] => {
    if (!isPositiveNumber(budget.otherLimit)) {
        return [];
    }

    const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));
    const limitedCategorySpent = categoryLimits.reduce((sum, limit) => sum + (spentByCategoryMap.get(limit.categoryId) ?? 0), 0);
    const otherSpent = Math.max(0, spent.spentOverall - limitedCategorySpent);

    return BUDGET_ALERT_THRESHOLDS.filter(threshold => crossesThreshold(otherSpent, budget.otherLimit, threshold)).map(threshold => ({
        scope: BudgetAlertScopeEnum.OTHER,
        categoryId: null,
        threshold
    }));
};

export const computeBudgetAlertTriggers = (
    budget: BudgetAlertBudgetInterface,
    spent: BudgetSpentInterface,
    categoryLimits: readonly BudgetCategoryLimitInputInterface[]
): BudgetAlertTriggerInterface[] => [
    ...computeOverallTriggers(budget, spent),
    ...computeCategoryTriggers(spent, categoryLimits),
    ...computeOtherTriggers(budget, spent, categoryLimits)
];
