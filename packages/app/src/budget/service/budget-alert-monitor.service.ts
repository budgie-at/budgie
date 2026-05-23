import { Log } from '@budgie/logger';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { budgetCategoryLimitRepository, budgetRepository, categoryRepository } from '../../@generic/drizzle/db/db';
import { postLocalNotification } from '../../@generic/utils/request-push-permission.util';
import { BUDGET_ALERT_MONITOR_TASK } from '../constant/budget-alert-monitor-task.constant';
import { BudgetAlertScopeEnum } from '../enum/budget-alert-scope.enum';
import { computeBudgetSpent } from '../utils/compute-budget-spent.util';
import { computePeriodWindow } from '../utils/compute-period-window.util';

import { budgetAlertService } from './budget-alert.service';

import type { BudgetAlertTriggerInterface } from '../interface/budget-alert-trigger.interface';
import type { BudgetSpentInterface } from '../interface/budget-spent.interface';
import type { BudgetEntityInterface } from '@budgie/contracts';

class BudgetAlertMonitorService {
    private static readonly MINIMUM_INTERVAL_SECONDS = 15 * 60;

    @Log('enter', result => `done newTriggers=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    async run(): Promise<BudgetAlertTriggerInterface[]> {
        const budget = await budgetRepository.getActive();

        if (!isDefined(budget) || !budget.pushEnabled) {
            return [];
        }

        const periodStartMs = computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date()).periodStart.getTime();
        const spent = await this.computeSpent(budget.periodStartDay, budget.useLastDayOfMonth, budget.instrumentId);
        const categoryLimits = await budgetCategoryLimitRepository.getByBudget(budget.id);
        const newTriggers = await budgetAlertService.evaluate(budget, spent, categoryLimits);

        await this.postAndMarkTriggers(newTriggers, budget, periodStartMs, spent);

        return newTriggers;
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(BUDGET_ALERT_MONITOR_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(BUDGET_ALERT_MONITOR_TASK, {
            minimumInterval: BudgetAlertMonitorService.MINIMUM_INTERVAL_SECONDS
        });
    }

    private async computeSpent(
        periodStartDay: number,
        useLastDayOfMonth: boolean,
        baseInstrumentId: number
    ): Promise<BudgetSpentInterface> {
        const { periodStart, nextPeriodStart } = computePeriodWindow(periodStartDay, useLastDayOfMonth, new Date());

        if (!isPositiveNumber(baseInstrumentId)) {
            return { spentOverall: 0, spentByCategory: [], fallbackCount: 0 };
        }

        const entries = await budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, baseInstrumentId);

        return computeBudgetSpent(entries, baseInstrumentId);
    }

    private async postAndMarkTriggers(
        triggers: BudgetAlertTriggerInterface[],
        budget: Pick<BudgetEntityInterface, 'id' | 'overallLimit'>,
        periodStartMs: number,
        spent: BudgetSpentInterface
    ): Promise<void> {
        for (const trigger of triggers) {
            // eslint-disable-next-line no-await-in-loop
            const posted = await this.postTrigger(trigger, budget.overallLimit, spent)
                .then(() => true)
                .catch(() => false);

            if (posted) {
                // eslint-disable-next-line no-await-in-loop
                await budgetAlertService.markDelivered(budget.id, periodStartMs, [trigger]);
            }
        }
    }

    private async postTrigger(trigger: BudgetAlertTriggerInterface, overallLimit: number, spent: BudgetSpentInterface): Promise<void> {
        if (trigger.scope === BudgetAlertScopeEnum.OVERALL) {
            await this.postOverallAlert(trigger.threshold, overallLimit, spent.spentOverall);

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

    private async postCategoryAlert(threshold: number, categoryId: number): Promise<void> {
        const category = await categoryRepository.findById(categoryId);
        const categoryName = isDefined(category) ? category.title : i18n._(msg`Category`);
        const title = threshold >= 100 ? i18n._(msg`${categoryName}: limit reached`) : i18n._(msg`${categoryName}: ${threshold}% spent`);
        const body = i18n._(msg`You have used ${threshold}% of the limit for ${categoryName}.`);

        await postLocalNotification(title, body);
    }
}

export const budgetAlertMonitorService = new BudgetAlertMonitorService();
