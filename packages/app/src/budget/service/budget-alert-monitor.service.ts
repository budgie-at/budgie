import { BudgetAlertScopeEnum, budgetAlertThresholdService, budgetPeriodService, budgetSpentService } from '@budgie/budget';
import { LanguageEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import * as BackgroundTask from 'expo-background-task';
import Storage from 'expo-sqlite/kv-store';
import * as TaskManager from 'expo-task-manager';
import { z } from 'zod';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { budgetCategoryLimitRepository, budgetRepository, categoryRepository, settingsRepository } from '../../@generic/drizzle/db/db';
import { postLocalNotification } from '../../@generic/utils/request-push-permission.util';
import { BudgetBackgroundTaskNameEnum } from '../enum/budget-background-task-name.enum';

import type { BudgetAlertTriggerInterface, BudgetSpentInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

class BudgetAlertMonitorService {
    private static readonly MINIMUM_INTERVAL_SECONDS = 15 * 60;
    private static readonly STORAGE_KEY_PREFIX = '@budgie:budget-alerts-fired';
    private static readonly FiredTriggersSchema = z.array(z.string());

    @Log('enter', result => `done newTriggers=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    async run(): Promise<BudgetAlertTriggerInterface[]> {
        const [budget, settings] = await Promise.all([budgetRepository.getActive(), settingsRepository.findSettings()]);
        const isBudgetPushEnabled = isDefined(settings) ? settings.isBudgetPushEnabled : false;

        if (!isDefined(budget) || !isBudgetPushEnabled) {
            return [];
        }

        const periodStartMs = budgetPeriodService
            .computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date())
            .periodStart.getTime();
        const spent = await this.computeSpent(budget);
        const categoryLimits = await budgetCategoryLimitRepository.getByBudget(budget.id);
        const triggers = budgetAlertThresholdService.computeTriggers(budget, spent, categoryLimits);
        const newTriggers = await this.filterDeliveredTriggers(budget.id, periodStartMs, triggers);

        await this.postAndMarkTriggers(newTriggers, budget, periodStartMs, spent);

        return newTriggers;
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(BudgetBackgroundTaskNameEnum.ALERT_MONITOR)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(BudgetBackgroundTaskNameEnum.ALERT_MONITOR, {
            minimumInterval: BudgetAlertMonitorService.MINIMUM_INTERVAL_SECONDS
        });
    }

    private async computeSpent(
        budget: Pick<BudgetEntityInterface, 'periodStartDay' | 'useLastDayOfMonth' | 'instrumentId'>
    ): Promise<BudgetSpentInterface> {
        if (!isPositiveNumber(budget.instrumentId)) {
            return { spentOverall: 0, spentByCategory: [] };
        }

        const { periodStart, nextPeriodStart } = budgetPeriodService.computePeriodWindow(
            budget.periodStartDay,
            budget.useLastDayOfMonth,
            new Date()
        );
        const entries = await budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, budget.instrumentId);

        return budgetSpentService.computeSpent(entries, budget.instrumentId);
    }

    private async filterDeliveredTriggers(
        budgetId: number,
        periodStartMs: number,
        triggers: readonly BudgetAlertTriggerInterface[]
    ): Promise<BudgetAlertTriggerInterface[]> {
        const fired = await this.loadDeliveredTriggerKeys(this.buildStorageKey(budgetId, periodStartMs));

        return triggers.filter(trigger => !fired.has(this.buildTriggerKey(trigger)));
    }

    private async postAndMarkTriggers(
        triggers: readonly BudgetAlertTriggerInterface[],
        budget: Pick<BudgetEntityInterface, 'id' | 'overallLimit'>,
        periodStartMs: number,
        spent: BudgetSpentInterface
    ): Promise<void> {
        await Promise.all(triggers.map(trigger => this.postAndMarkTrigger(trigger, budget, periodStartMs, spent)));
    }

    private async postAndMarkTrigger(
        trigger: BudgetAlertTriggerInterface,
        budget: Pick<BudgetEntityInterface, 'id' | 'overallLimit'>,
        periodStartMs: number,
        spent: BudgetSpentInterface
    ): Promise<void> {
        const posted = await this.postTrigger(trigger, budget.overallLimit, spent)
            .then(() => true)
            .catch(() => false);

        if (posted) {
            await this.markDelivered(budget.id, periodStartMs, [trigger]);
        }
    }

    private async markDelivered(budgetId: number, periodStartMs: number, triggers: readonly BudgetAlertTriggerInterface[]): Promise<void> {
        if (!isNotEmptyArray(triggers)) {
            return;
        }

        const storageKey = this.buildStorageKey(budgetId, periodStartMs);
        const fired = await this.loadDeliveredTriggerKeys(storageKey);
        triggers.forEach(trigger => fired.add(this.buildTriggerKey(trigger)));
        await Storage.setItem(storageKey, JSON.stringify([...fired]));
    }

    private async loadDeliveredTriggerKeys(storageKey: string): Promise<Set<string>> {
        const raw = await Storage.getItem(storageKey);

        if (!isDefined(raw)) {
            return new Set();
        }

        return this.parseDeliveredTriggerKeys(raw);
    }

    private parseDeliveredTriggerKeys(raw: string): Set<string> {
        try {
            const parsed = BudgetAlertMonitorService.FiredTriggersSchema.safeParse(JSON.parse(raw));

            if (!parsed.success) {
                return new Set();
            }

            return new Set(parsed.data);
        } catch {
            return new Set();
        }
    }

    private buildStorageKey(budgetId: number, periodStartMs: number): string {
        return `${BudgetAlertMonitorService.STORAGE_KEY_PREFIX}:${budgetId}:${periodStartMs}`;
    }

    private buildTriggerKey(trigger: BudgetAlertTriggerInterface): string {
        const categoryKey = isDefined(trigger.categoryId) ? trigger.categoryId : '';

        return `${trigger.scope}:${categoryKey}:${trigger.threshold}`;
    }

    private async postTrigger(trigger: BudgetAlertTriggerInterface, overallLimit: number, spent: BudgetSpentInterface): Promise<void> {
        if (trigger.scope === BudgetAlertScopeEnum.OVERALL) {
            await this.postOverallAlert(trigger.threshold, overallLimit, spent.spentOverall);

            return;
        }

        if (trigger.scope === BudgetAlertScopeEnum.OTHER) {
            await this.postOtherAlert(trigger.threshold);

            return;
        }

        if (isDefined(trigger.categoryId)) {
            await this.postCategoryAlert(trigger.threshold, trigger.categoryId);
        }
    }

    private async postOverallAlert(threshold: number, overallLimit: number, spentOverall: number): Promise<void> {
        const spentPercent = isPositiveNumber(overallLimit) ? Math.round((spentOverall / overallLimit) * 100) : threshold;
        const title = threshold >= 100 ? i18n._(msg`Budget limit reached`) : i18n._(msg`Overall budget: ${threshold}% spent`);
        const body = i18n._(msg`You have used ${spentPercent}% of your overall budget.`);

        await postLocalNotification(title, body);
    }

    private async postOtherAlert(threshold: number): Promise<void> {
        const title = threshold >= 100 ? i18n._(msg`Other budget: limit reached`) : i18n._(msg`Other budget: ${threshold}% spent`);
        const body = i18n._(msg`You have used ${threshold}% of your budget for spending outside category limits.`);

        await postLocalNotification(title, body);
    }

    private async postCategoryAlert(threshold: number, categoryId: number): Promise<void> {
        const settings = await settingsRepository.findSettings();
        const language = isDefined(settings) ? settings.language : LanguageEnum.EN;
        const [category] = await categoryRepository.findById(categoryId, language);
        const categoryName = isDefined(category) ? category.title : i18n._(msg`Category`);
        const title = threshold >= 100 ? i18n._(msg`${categoryName}: limit reached`) : i18n._(msg`${categoryName}: ${threshold}% spent`);
        const body = i18n._(msg`You have used ${threshold}% of the limit for ${categoryName}.`);

        await postLocalNotification(title, body);
    }
}

export const budgetAlertMonitorService = new BudgetAlertMonitorService();
