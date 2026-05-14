import { BudgetAlertScopeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { budgetAlertRepository } from '../../@generic/drizzle/db/db';
import { computePeriodWindow } from '../utils/compute-period-window.util';

import type { BudgetAlertTriggerInterface } from '../interface/budget-alert-trigger.interface';
import type { BudgetSpentInterface } from '../interface/budget-spent.interface';
import type { BudgetAlertEntityInterface, BudgetCategoryLimitEntityInterface, BudgetEntityInterface } from '@budgie/contracts';

class BudgetAlertService {
    private static readonly BUDGET_ALERT_THRESHOLDS = [80, 100] as const;

    @Log(
        (budget, spent, categoryLimits) =>
            `enter budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length}`,
        (result, budget, spent, categoryLimits) =>
            `done budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length} newAlerts=${result.length}`,
        (error, budget, spent, categoryLimits) =>
            `throw budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length} error=${getErrorMessage(error)}`
    )
    async evaluateAndPersist(
        budget: BudgetEntityInterface,
        spent: BudgetSpentInterface,
        categoryLimits: readonly BudgetCategoryLimitEntityInterface[]
    ): Promise<BudgetAlertEntityInterface[]> {
        const { periodStart } = computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date());
        const triggers = this.computeTriggers(budget, spent, categoryLimits);

        const rows = await Promise.all(
            triggers.map(trigger =>
                budgetAlertRepository.createIfMissing({
                    budgetId: budget.id,
                    periodStart,
                    scope: trigger.scope,
                    categoryId: trigger.categoryId,
                    threshold: trigger.threshold
                })
            )
        );

        return rows.filter(isDefined);
    }

    private computeTriggers(
        budget: BudgetEntityInterface,
        spent: BudgetSpentInterface,
        categoryLimits: readonly BudgetCategoryLimitEntityInterface[]
    ): BudgetAlertTriggerInterface[] {
        const overallTriggers = this.computeOverallTriggers(budget, spent);
        const categoryTriggers = this.computeCategoryTriggers(spent, categoryLimits);

        return [...overallTriggers, ...categoryTriggers];
    }

    private computeOverallTriggers(budget: BudgetEntityInterface, spent: BudgetSpentInterface): BudgetAlertTriggerInterface[] {
        return BudgetAlertService.BUDGET_ALERT_THRESHOLDS.filter(threshold =>
            this.crossesThreshold(spent.spentOverall, budget.overallLimit, threshold)
        ).map(threshold => ({ scope: BudgetAlertScopeEnum.OVERALL, categoryId: null, threshold }));
    }

    private computeCategoryTriggers(
        spent: BudgetSpentInterface,
        categoryLimits: readonly BudgetCategoryLimitEntityInterface[]
    ): BudgetAlertTriggerInterface[] {
        const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));

        return categoryLimits.flatMap(limit => {
            if (!isPositiveNumber(limit.limitAmount)) {
                return [];
            }

            const categorySpent = spentByCategoryMap.get(limit.categoryId) ?? 0;

            return BudgetAlertService.BUDGET_ALERT_THRESHOLDS.filter(threshold =>
                this.crossesThreshold(categorySpent, limit.limitAmount, threshold)
            ).map(threshold => ({ scope: BudgetAlertScopeEnum.CATEGORY, categoryId: limit.categoryId, threshold }));
        });
    }

    private crossesThreshold(spent: number, limit: number, thresholdPercent: number): boolean {
        return isPositiveNumber(limit) && spent * 100 >= limit * thresholdPercent;
    }
}

export const budgetAlertService = new BudgetAlertService();
