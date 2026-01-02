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

    calculateMonthlyPeriodDates(startDay: number, referenceDate: Date = new Date()): { startDate: Date; endDate: Date } {
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();
        const effectiveStartDay = Math.min(startDay, new Date(year, month + 1, 0).getDate());
        const startDate = new Date(year, month, effectiveStartDay, 0, 0, 0, 0);

        if (referenceDate < startDate) {
            startDate.setMonth(month - 1);
        }

        const nextMonth = new Date(startDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const endDate = new Date(nextMonth);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }

    calculateWeeklyPeriodDates(startDay: number, referenceDate: Date = new Date()): { startDate: Date; endDate: Date } {
        const dayOfWeek = referenceDate.getDay();
        const diff = dayOfWeek - (startDay % 7);
        const startDate = new Date(referenceDate);
        startDate.setDate(referenceDate.getDate() - (diff >= 0 ? diff : diff + 7));
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }

    calculatePeriodDatesForType(options: {
        period: BudgetPeriodEnum;
        startDay: number;
        referenceDate?: Date;
        customStartDate?: Date | null;
        customEndDate?: Date | null;
    }): { startDate: Date; endDate: Date } {
        const { period, startDay, referenceDate = new Date(), customStartDate, customEndDate } = options;

        if (period === BudgetPeriodEnum.CUSTOM && isDefined(customStartDate) && isDefined(customEndDate)) {
            return { startDate: customStartDate, endDate: customEndDate };
        }

        if (period === BudgetPeriodEnum.WEEKLY) {
            return this.calculateWeeklyPeriodDates(startDay, referenceDate);
        }

        return this.calculateMonthlyPeriodDates(startDay, referenceDate);
    }

    calculateSafeToSpend(totalPlanned: number, totalActual: number, daysElapsed: number, totalDays: number): number {
        const idealSpent = (totalPlanned / totalDays) * daysElapsed;
        const safeToSpend = totalPlanned - totalActual;
        const adjustedSafe = safeToSpend - (totalActual - idealSpent);

        return Math.max(0, adjustedSafe);
    }

    calculateForecast(actualSpent: number, daysElapsed: number, totalDays: number): number {
        if (daysElapsed === 0) {
            return 0;
        }

        const dailyRate = actualSpent / daysElapsed;

        return Math.round(dailyRate * totalDays);
    }

    calculateRollover(planned: number, actual: number, rule: BudgetRolloverRuleEnum, cap?: number): number {
        const remaining = planned - actual;

        if (rule === BudgetRolloverRuleEnum.NONE) {
            return 0;
        }

        if (rule === BudgetRolloverRuleEnum.CARRY_POSITIVE) {
            if (remaining <= 0) {
                return 0;
            }

            return isDefined(cap) ? Math.min(remaining, cap) : remaining;
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (rule === BudgetRolloverRuleEnum.CARRY_ALL) {
            if (isDefined(cap)) {
                return remaining > 0 ? Math.min(remaining, cap) : Math.max(remaining, -cap);
            }

            return remaining;
        }

        return 0;
    }

    async transitionToNextPeriod(budgetId: number): Promise<void> {
        const budget = await budgetRepository.findById(budgetId);

        if (!isDefined(budget)) {
            throw new Error('budget-not-found');
        }

        const currentInstance = await budgetInstanceRepository.findCurrentByBudgetId(budgetId);
        if (!isDefined(currentInstance)) {
            return;
        }

        const now = new Date();
        if (now <= currentInstance.endDate) {
            return;
        }

        const allocations = await budgetAllocationRepository.findByBudgetId(budgetId);
        const allocationInstances = await budgetAllocationInstanceRepository.findByBudgetInstanceId(currentInstance.id);

        await budgetInstanceRepository.close(currentInstance.id);

        const { startDate: newStartDate, endDate: newEndDate } = this.calculatePeriodDatesForType({
            period: budget.period,
            startDay: budget.startDay,
            referenceDate: now,
            customStartDate: budget.customStartDate,
            customEndDate: budget.customEndDate
        });

        await db.transaction(async tx => {
            const newInstance = await budgetInstanceRepository.create(
                {
                    budgetId,
                    startDate: newStartDate,
                    endDate: newEndDate,
                    status: BudgetInstanceStatusEnum.OPEN
                },
                tx
            );

            const newAllocationInstances = allocations.map(allocation => {
                const prevInstance = allocationInstances.find(ai => ai.budgetAllocationId === allocation.id);
                const prevPlanned = prevInstance?.planned ?? allocation.amount;
                const prevActual = prevInstance?.actual ?? 0;

                const rolloverAmount = this.calculateRollover(
                    prevPlanned,
                    prevActual,
                    allocation.rolloverRule,
                    allocation.rolloverCap ?? undefined
                );

                return {
                    budgetInstanceId: newInstance.id,
                    budgetAllocationId: allocation.id,
                    categoryId: allocation.categoryId,
                    planned: allocation.amount,
                    rolloverIn: rolloverAmount
                };
            });

            await budgetAllocationInstanceRepository.bulkCreate(newAllocationInstances, tx);
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
            // eslint-disable-next-line no-console
            console.error(`Failed to transition budget ${activeBudget.id}`);
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

    calculateNextMonthlyPeriodDates(startDay: number, currentPeriodEndDate: Date): { startDate: Date; endDate: Date } {
        const startDate = new Date(currentPeriodEndDate);
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);

        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        const effectiveStartDay = Math.min(startDay, new Date(year, month + 1, 0).getDate());
        startDate.setDate(effectiveStartDay);

        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }

    calculateNextWeeklyPeriodDates(currentPeriodEndDate: Date): { startDate: Date; endDate: Date } {
        const startDate = new Date(currentPeriodEndDate);
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }

    calculateFuturePeriods(
        period: BudgetPeriodEnum,
        startDay: number,
        currentPeriodEndDate: Date,
        count: number
    ): Array<{ startDate: Date; endDate: Date; label: string }> {
        const periods: Array<{ startDate: Date; endDate: Date; label: string }> = [];
        let lastEndDate = currentPeriodEndDate;

        for (let i = 0; i < count; i += 1) {
            const dates =
                period === BudgetPeriodEnum.WEEKLY
                    ? this.calculateNextWeeklyPeriodDates(lastEndDate)
                    : this.calculateNextMonthlyPeriodDates(startDay, lastEndDate);

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const label =
                period === BudgetPeriodEnum.WEEKLY
                    ? `Week of ${monthNames[dates.startDate.getMonth()]} ${dates.startDate.getDate()}`
                    : `${monthNames[dates.startDate.getMonth()]} ${dates.startDate.getFullYear()}`;

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
