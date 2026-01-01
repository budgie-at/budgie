import {
    BudgetAllocationCreateEntityInterface,
    BudgetCreateEntityInterface,
    BudgetInstanceStatusEnum,
    BudgetPeriodEnum,
    BudgetRolloverRuleEnum,
    BudgetStatusEnum,
    BudgetUpdateEntityInterface
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
        return budgetRepository.create({ ...input, status: BudgetStatusEnum.ACTIVE });
    }

    async updateBudget(id: number, input: BudgetUpdateEntityInterface) {
        return budgetRepository.updateById(id, input);
    }

    async deleteBudget(id: number) {
        return budgetRepository.deleteById(id);
    }

    async getBudgetById(id: number) {
        return budgetRepository.findById(id);
    }

    async getActiveBudgets() {
        return budgetRepository.findActive();
    }

    async getTemplates() {
        return budgetRepository.findTemplates();
    }

    async activateBudget(id: number) {
        return budgetRepository.activate(id);
    }

    async archiveBudget(id: number) {
        return budgetRepository.archive(id);
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

    async addAllocation(budgetId: number, input: Omit<BudgetAllocationCreateEntityInterface, 'budgetId'>) {
        return budgetAllocationRepository.create({ ...input, budgetId });
    }

    async updateAllocation(id: number, input: Partial<BudgetAllocationCreateEntityInterface>) {
        return budgetAllocationRepository.updateById(id, input);
    }

    async deleteAllocation(id: number) {
        return budgetAllocationRepository.deleteById(id);
    }

    async getAllocations(budgetId: number) {
        return budgetAllocationRepository.findByBudgetIdWithCategory(budgetId);
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

    async getCurrentInstance(budgetId: number) {
        return budgetInstanceRepository.findCurrentByBudgetId(budgetId);
    }

    async getInstanceWithDetails(instanceId: number) {
        return budgetInstanceRepository.findByIdWithRelations(instanceId);
    }

    async closeInstance(instanceId: number) {
        return budgetInstanceRepository.close(instanceId);
    }

    async moveEnvelopeFunds(fromAllocationInstanceId: number, toAllocationInstanceId: number, amount: number) {
        if (amount <= 0) {
            throw new Error('amount-must-be-positive');
        }

        await budgetAllocationInstanceRepository.adjustAmount(fromAllocationInstanceId, -amount);
        await budgetAllocationInstanceRepository.adjustAmount(toAllocationInstanceId, amount);
    }

    async updateAllocationInstanceActual(allocationInstanceId: number, actualAmount: number) {
        return budgetAllocationInstanceRepository.updateById(allocationInstanceId, { actual: actualAmount });
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

    calculatePeriodDatesForType(
        period: BudgetPeriodEnum,
        startDay: number,
        referenceDate: Date = new Date()
    ): { startDate: Date; endDate: Date } {
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

        const { startDate: newStartDate, endDate: newEndDate } = this.calculatePeriodDatesForType(
            budget.period,
            budget.startDay,
            now
        );

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

    async checkAndTransitionAllBudgets(): Promise<void> {
        const activeBudgets = await budgetRepository.findActive();

        for (const budget of activeBudgets) {
            try {
                await this.transitionToNextPeriod(budget.id);
            } catch {
                // eslint-disable-next-line no-console
                console.error(`Failed to transition budget ${budget.id}`);
            }
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

        const { startDate, endDate } = this.calculatePeriodDatesForType(budget.period, budget.startDay, new Date());

        await this.createBudgetInstance(budgetId, startDate, endDate);
    }
}

export const budgetService = new BudgetService();
