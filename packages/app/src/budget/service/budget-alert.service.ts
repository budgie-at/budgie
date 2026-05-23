import { Log } from '@budgie/logger';
import Storage from 'expo-sqlite/kv-store';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BudgetAlertScopeEnum } from '../enum/budget-alert-scope.enum';
import { computePeriodWindow } from '../utils/compute-period-window.util';

import type { BudgetAlertTriggerInterface } from '../interface/budget-alert-trigger.interface';
import type { BudgetSpentInterface } from '../interface/budget-spent.interface';
import type { BudgetCategoryLimitEntityInterface, BudgetEntityInterface } from '@budgie/contracts';

class BudgetAlertService {
    private static readonly BUDGET_ALERT_THRESHOLDS = [80, 100] as const;
    private static readonly STORAGE_KEY_PREFIX = '@budgie:budget-alerts-fired';

    @Log(
        (budget, spent, categoryLimits) =>
            `enter budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length}`,
        (result, budget, spent, categoryLimits) =>
            `done budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length} newTriggers=${result.length} triggerKeys=${result.map(trigger => `${trigger.scope}:${trigger.categoryId ?? ''}:${trigger.threshold}`).join(',')}`,
        (error, budget, spent, categoryLimits) =>
            `throw budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length} error=${getErrorMessage(error)}`
    )
    async evaluate(
        budget: BudgetEntityInterface,
        spent: BudgetSpentInterface,
        categoryLimits: readonly BudgetCategoryLimitEntityInterface[]
    ): Promise<BudgetAlertTriggerInterface[]> {
        const { periodStart } = computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date());
        const triggers = this.computeTriggers(budget, spent, categoryLimits);

        const storageKey = this.buildStorageKey(budget.id, periodStart.getTime());
        const fired = await this.loadFired(storageKey);

        return triggers.filter(trigger => !fired.has(this.buildTriggerKey(trigger)));
    }

    @Log(
        (budgetId, periodStartMs, triggers) =>
            `enter budgetId=${budgetId} periodStartMs=${periodStartMs} triggerKeys=${triggers.map(trigger => `${trigger.scope}:${trigger.categoryId ?? ''}:${trigger.threshold}`).join(',')}`,
        'done',
        (error, budgetId, periodStartMs, triggers) =>
            `throw budgetId=${budgetId} periodStartMs=${periodStartMs} triggerKeys=${triggers.map(trigger => `${trigger.scope}:${trigger.categoryId ?? ''}:${trigger.threshold}`).join(',')} error=${getErrorMessage(error)}`
    )
    async markDelivered(budgetId: number, periodStartMs: number, triggers: readonly BudgetAlertTriggerInterface[]): Promise<void> {
        if (!isNotEmptyArray(triggers)) {
            return;
        }

        const storageKey = this.buildStorageKey(budgetId, periodStartMs);
        const fired = await this.loadFired(storageKey);
        triggers.forEach(trigger => fired.add(this.buildTriggerKey(trigger)));
        await Storage.setItem(storageKey, JSON.stringify([...fired]));
    }

    private async loadFired(storageKey: string): Promise<Set<string>> {
        const raw = await Storage.getItem(storageKey);

        if (!isDefined(raw)) {
            return new Set();
        }

        return new Set(JSON.parse(raw) as string[]);
    }

    private buildStorageKey(budgetId: number, periodStartMs: number): string {
        return `${BudgetAlertService.STORAGE_KEY_PREFIX}:${budgetId}:${periodStartMs}`;
    }

    private buildTriggerKey(trigger: BudgetAlertTriggerInterface): string {
        return `${trigger.scope}:${trigger.categoryId ?? ''}:${trigger.threshold}`;
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
