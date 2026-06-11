import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { BudgetAlertScopeEnum } from '../enum/budget-alert-scope.enum';

import type { BudgetSpentInterface } from '../../spent/interface/budget-spent.interface';
import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetAlertBudgetInterface } from '../interface/budget-alert-budget.interface';
import type { BudgetAlertTriggerInterface } from '../interface/budget-alert-trigger.interface';

class BudgetAlertThresholdService {
    private static readonly BUDGET_ALERT_THRESHOLDS = [80, 100] as const;

    computeTriggers(
        budget: BudgetAlertBudgetInterface,
        spent: BudgetSpentInterface,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[]
    ): BudgetAlertTriggerInterface[] {
        const overallTriggers = this.computeOverallTriggers(budget, spent);
        const categoryTriggers = this.computeCategoryTriggers(spent, categoryLimits);
        const otherTriggers = this.computeOtherTriggers(budget, spent, categoryLimits);

        return [...overallTriggers, ...categoryTriggers, ...otherTriggers];
    }

    private computeOverallTriggers(budget: BudgetAlertBudgetInterface, spent: BudgetSpentInterface): BudgetAlertTriggerInterface[] {
        return BudgetAlertThresholdService.BUDGET_ALERT_THRESHOLDS.filter(threshold =>
            this.crossesThreshold(spent.spentOverall, budget.overallLimit, threshold)
        ).map(threshold => ({ scope: BudgetAlertScopeEnum.OVERALL, categoryId: null, threshold }));
    }

    private computeCategoryTriggers(
        spent: BudgetSpentInterface,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[]
    ): BudgetAlertTriggerInterface[] {
        const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));

        return categoryLimits.flatMap(limit => {
            if (!isPositiveNumber(limit.limitAmount)) {
                return [];
            }

            const categorySpent = spentByCategoryMap.get(limit.categoryId);
            const spentAmount = isDefined(categorySpent) ? categorySpent : 0;

            return BudgetAlertThresholdService.BUDGET_ALERT_THRESHOLDS.filter(threshold =>
                this.crossesThreshold(spentAmount, limit.limitAmount, threshold)
            ).map(threshold => ({ scope: BudgetAlertScopeEnum.CATEGORY, categoryId: limit.categoryId, threshold }));
        });
    }

    private computeOtherTriggers(
        budget: BudgetAlertBudgetInterface,
        spent: BudgetSpentInterface,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[]
    ): BudgetAlertTriggerInterface[] {
        if (!isPositiveNumber(budget.otherLimit)) {
            return [];
        }

        const limitedCategorySpent = this.computeLimitedCategorySpent(spent, categoryLimits);
        const otherSpent = Math.max(0, spent.spentOverall - limitedCategorySpent);

        return BudgetAlertThresholdService.BUDGET_ALERT_THRESHOLDS.filter(threshold =>
            this.crossesThreshold(otherSpent, budget.otherLimit, threshold)
        ).map(threshold => ({ scope: BudgetAlertScopeEnum.OTHER, categoryId: null, threshold }));
    }

    private computeLimitedCategorySpent(spent: BudgetSpentInterface, categoryLimits: readonly BudgetCategoryLimitInputInterface[]): number {
        const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));

        return categoryLimits.reduce((sum, limit) => {
            const categorySpent = spentByCategoryMap.get(limit.categoryId);
            const spentAmount = isDefined(categorySpent) ? categorySpent : 0;

            return sum + spentAmount;
        }, 0);
    }

    private crossesThreshold(spent: number, limit: number, thresholdPercent: number): boolean {
        return isPositiveNumber(limit) && spent * 100 >= limit * thresholdPercent;
    }
}

export const budgetAlertThresholdService = new BudgetAlertThresholdService();
