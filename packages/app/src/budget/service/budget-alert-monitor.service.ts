import { BudgetAlertScopeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { budgetCategoryLimitRepository, budgetRepository, categoryRepository, settingsRepository } from '../../@generic/drizzle/db/db';
import { postLocalNotification } from '../../@generic/utils/request-push-permission.util';
import { BUDGET_ALERT_MONITOR_TASK } from '../constant/budget-alert-monitor-task.constant';
import { computeBudgetSpent } from '../utils/compute-budget-spent.util';
import { computePeriodWindow } from '../utils/compute-period-window.util';

import { budgetAlertService } from './budget-alert.service';

import type { BudgetSpentInterface } from '../interface/budget-spent.interface';
import type { BudgetAlertEntityInterface } from '@budgie/contracts';

class BudgetAlertMonitorService {
    private static readonly MINIMUM_INTERVAL_SECONDS = 15 * 60;

    @Log('enter', result => `done newAlerts=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    async run(): Promise<BudgetAlertEntityInterface[]> {
        const budget = await budgetRepository.getActive();

        if (!isDefined(budget) || !budget.pushEnabled) {
            return [];
        }

        const spent = await this.computeSpent(budget.periodStartDay, budget.useLastDayOfMonth);
        const categoryLimits = await budgetCategoryLimitRepository.getByBudget(budget.id);
        const newAlerts = await budgetAlertService.evaluateAndPersist(budget, spent, categoryLimits);

        await this.postAlerts(newAlerts, budget.overallLimit, spent);

        return newAlerts;
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

    private async computeSpent(periodStartDay: number, useLastDayOfMonth: boolean): Promise<BudgetSpentInterface> {
        const { periodStart, nextPeriodStart } = computePeriodWindow(periodStartDay, useLastDayOfMonth, new Date());

        const settings = await settingsRepository.getSettings();
        const baseInstrumentId = settings.defaultInstrumentId;

        if (!isPositiveNumber(baseInstrumentId)) {
            return { spentOverall: 0, spentByCategory: [], fallbackCount: 0 };
        }

        const entries = await budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, baseInstrumentId);

        return computeBudgetSpent(entries, baseInstrumentId);
    }

    private async postAlerts(alerts: BudgetAlertEntityInterface[], overallLimit: number, spent: BudgetSpentInterface): Promise<void> {
        for (const alert of alerts) {
            // eslint-disable-next-line no-await-in-loop
            await this.postAlert(alert, overallLimit, spent);
        }
    }

    private async postAlert(alert: BudgetAlertEntityInterface, overallLimit: number, spent: BudgetSpentInterface): Promise<void> {
        if (alert.scope === BudgetAlertScopeEnum.OVERALL) {
            await this.postOverallAlert(alert.threshold, overallLimit, spent.spentOverall);

            return;
        }

        if (isDefined(alert.categoryId)) {
            await this.postCategoryAlert(alert.threshold, alert.categoryId);
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
