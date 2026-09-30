import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { BudgetAlertScopeEnum } from '../enum/budget-alert-scope.enum';

import type { BudgetSpentInterface } from '../../spent/interface/budget-spent.interface';
import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetAlertBudgetInterface } from '../interface/budget-alert-budget.interface';
import type { BudgetAlertTriggerInterface } from '../interface/budget-alert-trigger.interface';

export class BudgetAlertThresholdService extends Context.Service<BudgetAlertThresholdService>()(
    '@budgie/budget/BudgetAlertThresholdService',
    {
        make: Effect.sync(() => {
            const budgetAlertThresholds = [80, 100] as const;

            const crossesThreshold = (spent: number, limit: number, thresholdPercent: number): boolean =>
                isPositiveNumber(limit) && spent * 100 >= limit * thresholdPercent;

            const computeOverallTriggers = (
                budget: BudgetAlertBudgetInterface,
                spent: BudgetSpentInterface
            ): BudgetAlertTriggerInterface[] =>
                budgetAlertThresholds
                    .filter(threshold => crossesThreshold(spent.spentOverall, budget.overallLimit, threshold))
                    .map(threshold => ({ scope: BudgetAlertScopeEnum.OVERALL, categoryId: null, threshold }));

            const computeCategoryTriggers = (
                spent: BudgetSpentInterface,
                categoryLimits: readonly BudgetCategoryLimitInputInterface[]
            ): BudgetAlertTriggerInterface[] => {
                const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));

                return categoryLimits.flatMap(limit => {
                    if (!isPositiveNumber(limit.limitAmount)) {
                        return [];
                    }

                    const categorySpent = spentByCategoryMap.get(limit.categoryId);
                    const spentAmount = isDefined(categorySpent) ? categorySpent : 0;

                    return budgetAlertThresholds
                        .filter(threshold => crossesThreshold(spentAmount, limit.limitAmount, threshold))
                        .map(threshold => ({ scope: BudgetAlertScopeEnum.CATEGORY, categoryId: limit.categoryId, threshold }));
                });
            };

            const computeLimitedCategorySpent = (
                spent: BudgetSpentInterface,
                categoryLimits: readonly BudgetCategoryLimitInputInterface[]
            ): number => {
                const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));

                return categoryLimits.reduce((sum, limit) => {
                    const categorySpent = spentByCategoryMap.get(limit.categoryId);
                    const spentAmount = isDefined(categorySpent) ? categorySpent : 0;

                    return sum + spentAmount;
                }, 0);
            };

            const computeOtherTriggers = (
                budget: BudgetAlertBudgetInterface,
                spent: BudgetSpentInterface,
                categoryLimits: readonly BudgetCategoryLimitInputInterface[]
            ): BudgetAlertTriggerInterface[] => {
                if (!isPositiveNumber(budget.otherLimit)) {
                    return [];
                }

                const limitedCategorySpent = computeLimitedCategorySpent(spent, categoryLimits);
                const otherSpent = Math.max(0, spent.spentOverall - limitedCategorySpent);

                return budgetAlertThresholds
                    .filter(threshold => crossesThreshold(otherSpent, budget.otherLimit, threshold))
                    .map(threshold => ({ scope: BudgetAlertScopeEnum.OTHER, categoryId: null, threshold }));
            };

            return {
                computeTriggers: (
                    budget: BudgetAlertBudgetInterface,
                    spent: BudgetSpentInterface,
                    categoryLimits: readonly BudgetCategoryLimitInputInterface[]
                ): BudgetAlertTriggerInterface[] => [
                    ...computeOverallTriggers(budget, spent),
                    ...computeCategoryTriggers(spent, categoryLimits),
                    ...computeOtherTriggers(budget, spent, categoryLimits)
                ]
            };
        })
    }
) {
    static readonly layer = Layer.effect(BudgetAlertThresholdService, BudgetAlertThresholdService.make);
}
