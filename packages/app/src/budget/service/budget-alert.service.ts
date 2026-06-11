import { budgetAlertThresholdService, budgetPeriodService } from '@budgie/budget';
import { Log } from '@budgie/logger';
import Storage from 'expo-sqlite/kv-store';
import { z } from 'zod';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { BudgetAlertTriggerInterface, BudgetSpentInterface } from '@budgie/budget';
import type { BudgetCategoryLimitEntityInterface, BudgetEntityInterface } from '@budgie/contracts';

class BudgetAlertService {
    private static readonly STORAGE_KEY_PREFIX = '@budgie:budget-alerts-fired';
    private static readonly FiredTriggersSchema = z.array(z.string());

    @Log(
        (budget, spent, categoryLimits) =>
            `enter budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length}`,
        (result, budget, spent, categoryLimits) =>
            `done budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length} newTriggers=${result.length} triggerKeys=${result.map(trigger => `${trigger.scope}:${isDefined(trigger.categoryId) ? trigger.categoryId : ''}:${trigger.threshold}`).join(',')}`,
        (error, budget, spent, categoryLimits) =>
            `throw budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length} error=${getErrorMessage(error)}`
    )
    async evaluate(
        budget: BudgetEntityInterface,
        spent: BudgetSpentInterface,
        categoryLimits: readonly BudgetCategoryLimitEntityInterface[]
    ): Promise<BudgetAlertTriggerInterface[]> {
        const { periodStart } = budgetPeriodService.computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date());
        const triggers = budgetAlertThresholdService.computeTriggers(budget, spent, categoryLimits);
        const storageKey = this.buildStorageKey(budget.id, periodStart.getTime());
        const fired = await this.loadFired(storageKey);

        return triggers.filter(trigger => !fired.has(this.buildTriggerKey(trigger)));
    }

    @Log(
        (budgetId, periodStartMs, triggers) =>
            `enter budgetId=${budgetId} periodStartMs=${periodStartMs} triggerKeys=${triggers.map(trigger => `${trigger.scope}:${isDefined(trigger.categoryId) ? trigger.categoryId : ''}:${trigger.threshold}`).join(',')}`,
        'done',
        (error, budgetId, periodStartMs, triggers) =>
            `throw budgetId=${budgetId} periodStartMs=${periodStartMs} triggerKeys=${triggers.map(trigger => `${trigger.scope}:${isDefined(trigger.categoryId) ? trigger.categoryId : ''}:${trigger.threshold}`).join(',')} error=${getErrorMessage(error)}`
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

        const parsed = BudgetAlertService.FiredTriggersSchema.safeParse(JSON.parse(raw));

        if (!parsed.success) {
            return new Set();
        }

        return new Set(parsed.data);
    }

    private buildStorageKey(budgetId: number, periodStartMs: number): string {
        return `${BudgetAlertService.STORAGE_KEY_PREFIX}:${budgetId}:${periodStartMs}`;
    }

    private buildTriggerKey(trigger: BudgetAlertTriggerInterface): string {
        const categoryKey = isDefined(trigger.categoryId) ? trigger.categoryId : '';

        return `${trigger.scope}:${categoryKey}:${trigger.threshold}`;
    }
}

export const budgetAlertService = new BudgetAlertService();
