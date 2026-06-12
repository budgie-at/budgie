import { Log } from '@budgie/logger';
import { z } from 'zod';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { budgetPeriodService } from '../../period/service/budget-period.service';

import { budgetAlertThresholdService } from './budget-alert-threshold.service';

import type { BudgetSpentInterface } from '../../spent/interface/budget-spent.interface';
import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetAlertStorageInterface } from '../interface/budget-alert-storage.interface';
import type { BudgetAlertTrackedBudgetInterface } from '../interface/budget-alert-tracked-budget.interface';
import type { BudgetAlertTriggerInterface } from '../interface/budget-alert-trigger.interface';

export class BudgetAlertDeliveryService {
    private static readonly STORAGE_KEY_PREFIX = '@budgie:budget-alerts-fired';
    private static readonly FiredTriggersSchema = z.array(z.string());

    constructor(
        private readonly storage: BudgetAlertStorageInterface,
        private readonly getCurrentDate: () => Date = () => new Date()
    ) {}

    @Log(
        (budget, spent, categoryLimits) =>
            `enter budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length}`,
        (result, budget, spent, categoryLimits) =>
            `done budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length} newTriggers=${result.length} triggerKeys=${result.map(trigger => `${trigger.scope}:${isDefined(trigger.categoryId) ? trigger.categoryId : ''}:${trigger.threshold}`).join(',')}`,
        (error, budget, spent, categoryLimits) =>
            `throw budgetId=${budget.id} spentOverall=${spent.spentOverall} spentByCategory=${spent.spentByCategory.length} categoryLimits=${categoryLimits.length} error=${getErrorMessage(error)}`
    )
    async evaluate(
        budget: BudgetAlertTrackedBudgetInterface,
        spent: BudgetSpentInterface,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[]
    ): Promise<BudgetAlertTriggerInterface[]> {
        const { periodStart } = budgetPeriodService.computePeriodWindow(
            budget.periodStartDay,
            budget.useLastDayOfMonth,
            this.getCurrentDate()
        );
        const triggers = budgetAlertThresholdService.computeTriggers(budget, spent, categoryLimits);
        const storageKey = this.buildStorageKey(budget.id, periodStart.getTime());
        const fired = await this.loadFired(storageKey);

        return triggers.filter(trigger => !fired.has(this.buildTriggerKey(trigger)));
    }

    @Log(
        (budgetId, periodStartMs, triggers) =>
            `enter budgetId=${budgetId} periodStartMs=${periodStartMs} triggerKeys=${triggers.map(trigger => `${trigger.scope}:${isDefined(trigger.categoryId) ? trigger.categoryId : ''}:${trigger.threshold}`).join(',')}`,
        (result, budgetId, periodStartMs, triggers) =>
            `done budgetId=${budgetId} periodStartMs=${periodStartMs} triggerKeys=${triggers.map(trigger => `${trigger.scope}:${isDefined(trigger.categoryId) ? trigger.categoryId : ''}:${trigger.threshold}`).join(',')} result=${String(result)}`,
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
        await this.storage.setItem(storageKey, JSON.stringify([...fired]));
    }

    private async loadFired(storageKey: string): Promise<Set<string>> {
        const raw = await this.storage.getItem(storageKey);

        if (!isDefined(raw)) {
            return new Set();
        }

        return this.parseFired(raw);
    }

    private parseFired(raw: string): Set<string> {
        try {
            const parsed = BudgetAlertDeliveryService.FiredTriggersSchema.safeParse(JSON.parse(raw));

            if (!parsed.success) {
                return new Set();
            }

            return new Set(parsed.data);
        } catch {
            return new Set();
        }
    }

    private buildStorageKey(budgetId: number, periodStartMs: number): string {
        return `${BudgetAlertDeliveryService.STORAGE_KEY_PREFIX}:${budgetId}:${periodStartMs}`;
    }

    private buildTriggerKey(trigger: BudgetAlertTriggerInterface): string {
        const categoryKey = isDefined(trigger.categoryId) ? trigger.categoryId : '';

        return `${trigger.scope}:${categoryKey}:${trigger.threshold}`;
    }
}
