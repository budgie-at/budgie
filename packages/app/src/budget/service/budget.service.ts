import {
    BudgetCreateEntityInterface,
    BudgetInstanceStatusEnum,
    BudgetPeriodEnum,
    BudgetRolloverRuleEnum,
    BudgetStatusEnum
} from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isDefined } from '@rnw-community/shared';

import {
    budgetAllocationInstanceRepository,
    budgetAllocationRepository,
    budgetInstanceRepository,
    budgetRepository,
    db
} from '../../@generic/drizzle/db/db';
import { BUDGET_TRANSITION_TASK } from '../constant/budget-transition-task.constant';

import { budgetPeriodService } from './budget-period.service';

const ONE_HOUR_IN_SECONDS = 3600;

class BudgetService {
    async createBudget(input: BudgetCreateEntityInterface) {
        return db.transaction(async tx => {
            const budget = await budgetRepository.create({ ...input, status: BudgetStatusEnum.ACTIVE }, tx);
            await budgetRepository.deactivateAllExcept(budget.id, tx);

            return budget;
        });
    }

    async activateBudget(budgetId: number) {
        return budgetRepository.activate(budgetId);
    }

    async ensureSingleActiveBudget(): Promise<void> {
        const activeBudget = await budgetRepository.findActive();
        if (isDefined(activeBudget)) {
            await budgetRepository.deactivateAllExcept(activeBudget.id);
        }
    }

    async cloneBudget(sourceBudgetId: number, newTitle: string) {
        const sourceBudget = await budgetRepository.findById(sourceBudgetId);
        if (!isDefined(sourceBudget)) {
            throw new Error('budget-not-found');
        }

        const allocations = await budgetAllocationRepository.findByBudgetId(sourceBudgetId);

        return db.transaction(async tx => {
            const newBudget = await budgetRepository.create(
                {
                    title: newTitle,
                    period: sourceBudget.period,
                    startDay: sourceBudget.startDay,
                    instrumentId: sourceBudget.instrumentId,
                    status: BudgetStatusEnum.DRAFT
                },
                tx
            );

            const newAllocations = allocations.map(allocation => ({
                budgetId: newBudget.id,
                categoryId: allocation.categoryId,
                allocationType: allocation.allocationType,
                amount: allocation.amount,
                percentage: allocation.percentage,
                rolloverRule: allocation.rolloverRule,
                rolloverCap: allocation.rolloverCap,
                isSinkingFund: allocation.isSinkingFund,
                sinkingFundTarget: allocation.sinkingFundTarget,
                sinkingFundTargetDate: allocation.sinkingFundTargetDate,
                isExcluded: allocation.isExcluded
            }));

            await budgetAllocationRepository.bulkCreate(newAllocations, tx);

            return newBudget;
        });
    }

    async createBudgetInstance(budgetId: number, startDate: Date, endDate: Date) {
        const budget = await budgetRepository.findById(budgetId);
        if (!isDefined(budget)) {
            throw new Error('budget-not-found');
        }

        const allocations = await budgetAllocationRepository.findByBudgetId(budgetId);

        return db.transaction(async tx => {
            const instance = await budgetInstanceRepository.create(
                {
                    budgetId,
                    startDate,
                    endDate,
                    status: BudgetInstanceStatusEnum.OPEN
                },
                tx
            );

            const allocationInstances = allocations.map(allocation => ({
                budgetInstanceId: instance.id,
                budgetAllocationId: allocation.id,
                categoryId: allocation.categoryId,
                planned: allocation.amount
            }));

            await budgetAllocationInstanceRepository.bulkCreate(allocationInstances, tx);

            return instance;
        });
    }

    async moveEnvelopeFunds(fromAllocationInstanceId: number, toAllocationInstanceId: number, amount: number) {
        if (amount <= 0) {
            throw new Error('amount-must-be-positive');
        }

        await budgetAllocationInstanceRepository.adjustAmount(fromAllocationInstanceId, -amount);
        await budgetAllocationInstanceRepository.adjustAmount(toAllocationInstanceId, amount);
    }

    calculateMonthlyPeriodDates(startDay: number, referenceDate: Date = new Date()) {
        return budgetPeriodService.calculateMonthlyPeriodDates(startDay, referenceDate);
    }

    calculateWeeklyPeriodDates(startDay: number, referenceDate: Date = new Date()) {
        return budgetPeriodService.calculateWeeklyPeriodDates(startDay, referenceDate);
    }

    calculatePeriodDatesForType(options: {
        period: BudgetPeriodEnum;
        startDay: number;
        referenceDate?: Date;
        customStartDate?: Date | null;
        customEndDate?: Date | null;
    }) {
        return budgetPeriodService.calculatePeriodDatesForType(options);
    }

    calculateSafeToSpend(totalPlanned: number, totalActual: number, daysElapsed: number, totalDays: number) {
        return budgetPeriodService.calculateSafeToSpend(totalPlanned, totalActual, daysElapsed, totalDays);
    }

    calculateForecast(actualSpent: number, daysElapsed: number, totalDays: number) {
        return budgetPeriodService.calculateForecast(actualSpent, daysElapsed, totalDays);
    }

    calculateRollover(planned: number, actual: number, rule: BudgetRolloverRuleEnum, cap: number | null) {
        return budgetPeriodService.calculateRollover(planned, actual, rule, cap);
    }

    async transitionToNextPeriod(budgetId: number): Promise<void> {
        const budget = await budgetRepository.findById(budgetId);
        if (!isDefined(budget)) {throw new Error('budget-not-found');}

        const currentInstance = await budgetInstanceRepository.findCurrentByBudgetId(budgetId);
        if (!isDefined(currentInstance) || new Date() <= currentInstance.endDate) {return;}

        const allocations = await budgetAllocationRepository.findByBudgetId(budgetId);
        const allocationInstances = await budgetAllocationInstanceRepository.findByBudgetInstanceId(currentInstance.id);
        await budgetInstanceRepository.close(currentInstance.id);

        const { startDate, endDate } = this.calculatePeriodDatesForType({ period: budget.period, startDay: budget.startDay, referenceDate: new Date(), customStartDate: budget.customStartDate, customEndDate: budget.customEndDate });

        await db.transaction(async tx => {
            const inst = await budgetInstanceRepository.create({ budgetId, startDate, endDate, status: BudgetInstanceStatusEnum.OPEN }, tx);
            const newItems = allocations.map(al => ({ budgetInstanceId: inst.id, budgetAllocationId: al.id, categoryId: al.categoryId, planned: al.amount, rolloverIn: this.calculateRollover(allocationInstances.find(ai => ai.budgetAllocationId === al.id)?.planned ?? al.amount, allocationInstances.find(ai => ai.budgetAllocationId === al.id)?.actual ?? 0, al.rolloverRule, al.rolloverCap) }));
            await budgetAllocationInstanceRepository.bulkCreate(newItems, tx);
        });
    }

    async checkAndTransitionActiveBudget(): Promise<void> {
        const activeBudget = await budgetRepository.findActive();

        if (!isDefined(activeBudget)) {
            return;
        }

        try {
            await this.transitionToNextPeriod(activeBudget.id);
        } catch {
            // Silent catch - budget transition failures are non-critical
        }
    }

    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(BUDGET_TRANSITION_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(BUDGET_TRANSITION_TASK, {
            minimumInterval: ONE_HOUR_IN_SECONDS
        });
    }

    async ensureCurrentInstance(budgetId: number): Promise<void> {
        const budget = await budgetRepository.findById(budgetId);
        if (!isDefined(budget)) {
            return;
        }

        const currentInstance = await budgetInstanceRepository.findCurrentByBudgetId(budgetId);
        if (isDefined(currentInstance)) {
            return;
        }

        const { startDate, endDate } = this.calculatePeriodDatesForType({
            period: budget.period,
            startDay: budget.startDay,
            referenceDate: new Date(),
            customStartDate: budget.customStartDate,
            customEndDate: budget.customEndDate
        });

        await this.createBudgetInstance(budgetId, startDate, endDate);
    }

    calculateNextMonthlyPeriodDates(startDay: number, currentPeriodEndDate: Date) {
        return budgetPeriodService.calculateNextMonthlyPeriodDates(startDay, currentPeriodEndDate);
    }

    calculateNextWeeklyPeriodDates(currentPeriodEndDate: Date) {
        return budgetPeriodService.calculateNextWeeklyPeriodDates(currentPeriodEndDate);
    }

    calculateFuturePeriods(period: BudgetPeriodEnum, startDay: number, currentPeriodEndDate: Date, count: number) {
        const periods: Array<{ startDate: Date; endDate: Date; label: string }> = [];
        let lastEndDate = currentPeriodEndDate;

        for (let i = 0; i < count; i += 1) {
            const dates =
                period === BudgetPeriodEnum.WEEKLY
                    ? budgetPeriodService.calculateNextWeeklyPeriodDates(lastEndDate)
                    : budgetPeriodService.calculateNextMonthlyPeriodDates(startDay, lastEndDate);

            const label = budgetPeriodService.formatPeriodLabel(period, dates.startDate);

            periods.push({ ...dates, label });
            lastEndDate = dates.endDate;
        }

        return periods;
    }

    async createFutureBudgetInstance(budgetId: number, startDate: Date, endDate: Date) {
        return this.createBudgetInstance(budgetId, startDate, endDate);
    }
}

export const budgetService = new BudgetService();
