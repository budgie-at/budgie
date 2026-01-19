import {
    BudgetAlertCreateEntityInterface,
    BudgetAlertEntityInterface,
    BudgetAlertSettingsEntityInterface,
    BudgetAlertSeverityEnum,
    BudgetAlertTypeEnum,
    BudgetEntityInterface,
    TransactionTypeEnum,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { budgetAlertRepository, budgetAlertSettingsRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { BUDGET_ALERT_CHECK_TASK } from '../constant/budget-alert-check-task.constant';
import { BudgetCalculationResultInterface } from '../interface/budget-calculation-result.interface';

import { budgetAlertNotificationService } from './budget-alert-notification.service';
import { budgetCalculationService } from './budget-calculation.service';
import { budgetService } from './budget.service';

/* eslint-disable max-lines */

interface DefaultSettingsInterface {
    readonly warningThreshold: number;
    readonly exceededThreshold: number;
    readonly largeExpenseThreshold: number;
    readonly paceAlertsEnabled: boolean;
    readonly predictiveAlertsEnabled: boolean;
    readonly pushNotificationsEnabled: boolean;
}

interface AlertCheckResultInterface {
    readonly shouldCreate: boolean;
    readonly severity: BudgetAlertSeverityEnum;
    readonly percentage: number;
}

const DEFAULT_SETTINGS: DefaultSettingsInterface = {
    warningThreshold: 80,
    exceededThreshold: 100,
    largeExpenseThreshold: 10,
    paceAlertsEnabled: true,
    predictiveAlertsEnabled: true,
    pushNotificationsEnabled: true
};

const PACE_MILESTONES = [25, 50, 75];
const PACE_TOLERANCE_DAYS = 1;
const PREDICTIVE_THRESHOLD_PERCENTAGE = 5;

class BudgetAlertService {
    async checkThresholdAlerts(budgetId: number): Promise<void> {
        const budget = await budgetService.getActive();

        if (!isDefined(budget)) {
            return;
        }

        const [calculation, settings, existingAlerts] = await Promise.all([
            budgetCalculationService.calculate(budget),
            this.getSettings(budgetId),
            budgetAlertRepository.findActiveByBudgetId(budgetId, budget.startDate)
        ]);

        await this.checkOverallThreshold(budget, calculation, settings, existingAlerts);
        await this.checkCategoryThresholds(budget, calculation, settings, existingAlerts);
    }

    async checkPaceAlerts(budgetId: number): Promise<void> {
        const budget = await budgetService.getActive();

        if (!isDefined(budget) || !(await this.getSettings(budgetId)).paceAlertsEnabled) {
            return;
        }

        const [calculation, existingAlerts] = await Promise.all([
            budgetCalculationService.calculate(budget),
            budgetAlertRepository.findActiveByBudgetId(budgetId, budget.startDate)
        ]);

        const periodProgress = (calculation.daysElapsed / calculation.daysInPeriod) * 100;
        const milestone = this.findCurrentMilestone(periodProgress, calculation.daysInPeriod);
        const alreadyAlerted = this.hasExistingPaceAlert(existingAlerts, milestone);

        if (!isPositiveNumber(milestone) || alreadyAlerted || calculation.overallPercentage <= periodProgress) {
            return;
        }

        await this.createPaceAlert(budgetId, budget.startDate, calculation.overallPercentage);
    }

    async checkLargeExpenseAlert(transactionId: number): Promise<void> {
        const transaction = await transactionRepository.getById(transactionId);

        if (!this.isValidExpenseTransaction(transaction)) {
            return;
        }

        const budget = await budgetService.getActive();

        if (!isDefined(budget)) {
            return;
        }

        const amount = this.calculateTransactionAmount(transaction);
        const shouldAlert = await this.shouldCreateLargeExpenseAlert(budget, transactionId, amount);

        if (shouldAlert) {
            await this.createLargeExpenseAlert(budget, transactionId, amount);
        }
    }

    async checkPredictiveAlerts(budgetId: number): Promise<void> {
        const budget = await budgetService.getActive();

        if (!isDefined(budget) || !(await this.getSettings(budgetId)).predictiveAlertsEnabled) {
            return;
        }

        const [calculation, existingAlerts] = await Promise.all([
            budgetCalculationService.calculate(budget),
            budgetAlertRepository.findActiveByBudgetId(budgetId, budget.startDate)
        ]);

        const projectedSpending = (calculation.totalSpent / calculation.daysElapsed) * calculation.daysInPeriod;
        const projectedOverage = ((projectedSpending - calculation.overallLimit) / calculation.overallLimit) * 100;
        const alreadyAlerted = existingAlerts.some(alert => alert.type === BudgetAlertTypeEnum.PREDICTIVE);

        if (calculation.daysElapsed < 1 || projectedOverage <= PREDICTIVE_THRESHOLD_PERCENTAGE || alreadyAlerted) {
            return;
        }

        await this.createPredictiveAlert(budgetId, budget.startDate, projectedSpending, calculation.overallLimit);
    }

    async checkAllAlerts(budgetId: number): Promise<void> {
        await Promise.all([this.checkThresholdAlerts(budgetId), this.checkPaceAlerts(budgetId), this.checkPredictiveAlerts(budgetId)]);
    }

    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(BUDGET_ALERT_CHECK_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(BUDGET_ALERT_CHECK_TASK, {
            minimumInterval: 3600
        });
    }

    async getSettings(budgetId: number): Promise<BudgetAlertSettingsEntityInterface | DefaultSettingsInterface> {
        return (await budgetAlertSettingsRepository.findByBudgetId(budgetId)) ?? DEFAULT_SETTINGS;
    }

    private async checkOverallThreshold(
        budget: BudgetEntityInterface,
        calculation: BudgetCalculationResultInterface,
        settings: BudgetAlertSettingsEntityInterface | DefaultSettingsInterface,
        existingAlerts: BudgetAlertEntityInterface[]
    ): Promise<void> {
        const checkResult = this.evaluateThreshold(calculation.overallPercentage, settings, existingAlerts, null);

        if (checkResult.shouldCreate) {
            const alert = await budgetAlertRepository.create(this.buildThresholdAlertPayload(budget, null, checkResult));
            await budgetAlertNotificationService.sendAlertNotification(alert);
        }
    }

    private async checkCategoryThresholds(
        budget: BudgetEntityInterface,
        calculation: BudgetCalculationResultInterface,
        settings: BudgetAlertSettingsEntityInterface | DefaultSettingsInterface,
        existingAlerts: BudgetAlertEntityInterface[]
    ): Promise<void> {
        const alertsToCreate: BudgetAlertCreateEntityInterface[] = calculation.categoryStatuses
            .map(categoryStatus => {
                const checkResult = this.evaluateThreshold(categoryStatus.percentage, settings, existingAlerts, categoryStatus.category.id);

                return checkResult.shouldCreate ? this.buildThresholdAlertPayload(budget, categoryStatus.category.id, checkResult) : null;
            })
            .filter(isDefined);

        await Promise.all(alertsToCreate.map(alert => budgetAlertRepository.create(alert)));
    }

    private evaluateThreshold(
        percentage: number,
        settings: BudgetAlertSettingsEntityInterface | DefaultSettingsInterface,
        existingAlerts: BudgetAlertEntityInterface[],
        categoryId: number | null
    ): AlertCheckResultInterface {
        const relevantAlerts = existingAlerts.filter(
            alert =>
                alert.type === BudgetAlertTypeEnum.THRESHOLD &&
                (categoryId === null ? !isPositiveNumber(alert.categoryId) : alert.categoryId === categoryId)
        );

        const hasExceeded = relevantAlerts.some(alert => alert.severity === BudgetAlertSeverityEnum.EXCEEDED);
        const hasWarning = relevantAlerts.some(alert => alert.severity === BudgetAlertSeverityEnum.WARNING);

        if (percentage >= settings.exceededThreshold && !hasExceeded) {
            return { shouldCreate: true, severity: BudgetAlertSeverityEnum.EXCEEDED, percentage };
        }

        if (percentage >= settings.warningThreshold && percentage < settings.exceededThreshold && !hasWarning) {
            return { shouldCreate: true, severity: BudgetAlertSeverityEnum.WARNING, percentage };
        }

        return { shouldCreate: false, severity: BudgetAlertSeverityEnum.WARNING, percentage };
    }

    private findCurrentMilestone(periodProgress: number, daysInPeriod: number): number | null {
        const tolerance = (PACE_TOLERANCE_DAYS / daysInPeriod) * 100;

        return PACE_MILESTONES.find(ms => periodProgress >= ms - tolerance && periodProgress <= ms + tolerance) ?? null;
    }

    private hasExistingPaceAlert(existingAlerts: BudgetAlertEntityInterface[], milestone: number | null): boolean {
        return (
            isPositiveNumber(milestone) &&
            existingAlerts.some(
                alert => alert.type === BudgetAlertTypeEnum.PACE && Math.abs(alert.percentage - milestone) < PACE_TOLERANCE_DAYS
            )
        );
    }

    private isValidExpenseTransaction(tx: TransactionWithEntriesEntityInterface | undefined): tx is TransactionWithEntriesEntityInterface {
        return isDefined(tx) && tx.type === TransactionTypeEnum.EXPENSE;
    }

    private calculateTransactionAmount(transaction: TransactionWithEntriesEntityInterface): number {
        return transaction.entries.reduce((sum, entry) => sum + entry.amount, 0);
    }

    private async shouldCreateLargeExpenseAlert(budget: BudgetEntityInterface, transactionId: number, amount: number): Promise<boolean> {
        const [settings, existingAlerts] = await Promise.all([
            this.getSettings(budget.id),
            budgetAlertRepository.findActiveByBudgetId(budget.id, budget.startDate)
        ]);

        const threshold = (budget.overallLimit * settings.largeExpenseThreshold) / 100;
        const alreadyAlerted = existingAlerts.some(
            alert => alert.type === BudgetAlertTypeEnum.LARGE_EXPENSE && alert.transactionId === transactionId
        );

        return amount >= threshold && !alreadyAlerted;
    }

    private buildThresholdAlertPayload(
        budget: BudgetEntityInterface,
        categoryId: number | null,
        checkResult: AlertCheckResultInterface
    ): BudgetAlertCreateEntityInterface {
        return {
            budgetId: budget.id,
            categoryId,
            type: BudgetAlertTypeEnum.THRESHOLD,
            severity: checkResult.severity,
            percentage: Math.round(checkResult.percentage),
            amount: null,
            transactionId: null,
            periodStart: budget.startDate
        };
    }

    private async createPaceAlert(budgetId: number, periodStart: Date, percentage: number) {
        const alert = await budgetAlertRepository.create({
            budgetId,
            categoryId: null,
            type: BudgetAlertTypeEnum.PACE,
            severity: BudgetAlertSeverityEnum.WARNING,
            percentage: Math.round(percentage),
            amount: null,
            transactionId: null,
            periodStart
        });
        await budgetAlertNotificationService.sendAlertNotification(alert);
    }

    private async createLargeExpenseAlert(budget: BudgetEntityInterface, transactionId: number, amount: number) {
        const alert = await budgetAlertRepository.create({
            budgetId: budget.id,
            categoryId: null,
            type: BudgetAlertTypeEnum.LARGE_EXPENSE,
            severity: BudgetAlertSeverityEnum.WARNING,
            percentage: Math.round((amount / budget.overallLimit) * 100),
            amount,
            transactionId,
            periodStart: budget.startDate
        });
        await budgetAlertNotificationService.sendAlertNotification(alert);
    }

    private async createPredictiveAlert(budgetId: number, periodStart: Date, projectedSpending: number, overallLimit: number) {
        const percentage = Math.round((projectedSpending / overallLimit) * 100);

        const alert = await budgetAlertRepository.create({
            budgetId,
            categoryId: null,
            type: BudgetAlertTypeEnum.PREDICTIVE,
            severity: percentage >= 100 ? BudgetAlertSeverityEnum.EXCEEDED : BudgetAlertSeverityEnum.WARNING,
            percentage,
            amount: convertToMicroUnits(projectedSpending),
            transactionId: null,
            periodStart
        });
        await budgetAlertNotificationService.sendAlertNotification(alert);
    }
}

export const budgetAlertService = new BudgetAlertService();
