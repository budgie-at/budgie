import {
    BudgetCategoryLimitEntityInterface,
    BudgetEntityInterface,
    BudgetIncomeExpectationEntityInterface,
    CategoryEntityInterface,
    TransactionTypeEnum,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import { differenceInDays } from 'date-fns';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountBudgetExclusionRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { BudgetStatusEnum } from '../enum/budget-status.enum';
import { BudgetCalculationResultInterface, BudgetIncomeStatusInterface } from '../interface/budget-calculation-result.interface';
import { BudgetCategoryStatusInterface } from '../interface/budget-category-status.interface';

interface BudgetCategoryLimitWithCategoryInterface extends BudgetCategoryLimitEntityInterface {
    readonly category: CategoryEntityInterface;
}

interface BudgetIncomeExpectationWithCategoryInterface extends BudgetIncomeExpectationEntityInterface {
    readonly category: CategoryEntityInterface;
}

interface BudgetWithRelationsInterface extends BudgetEntityInterface {
    readonly categoryLimits: BudgetCategoryLimitWithCategoryInterface[];
    readonly incomeExpectations: BudgetIncomeExpectationWithCategoryInterface[];
}

interface OverallStatsInterface {
    readonly totalSpent: number;
    readonly overallRemaining: number;
    readonly overallPercentage: number;
    readonly overallStatus: BudgetStatusEnum;
}

interface AllocationStatsInterface {
    readonly allocatedAmount: number;
    readonly unallocatedBuffer: number;
}

interface IncomeStatsInterface {
    readonly totalExpectedIncome: number;
    readonly totalActualIncome: number;
    readonly incomeVariance: number;
}

interface PaceStatsInterface {
    readonly daysInPeriod: number;
    readonly daysElapsed: number;
    readonly dailyBudget: number;
    readonly expectedSpentByNow: number;
    readonly isOnPace: boolean;
    readonly paceVariance: number;
}

interface TransactionsByTypeInterface {
    readonly expenseTransactions: TransactionWithEntriesEntityInterface[];
    readonly incomeTransactions: TransactionWithEntriesEntityInterface[];
}

class BudgetCalculationService {
    async calculate(budget: BudgetEntityInterface): Promise<BudgetCalculationResultInterface> {
        const budgetWithRelations = budget as BudgetWithRelationsInterface;
        const { expenseTransactions, incomeTransactions } = await this.getTransactionsByType(budget);

        const categoryStatuses = this.calculateCategoryStatuses(budgetWithRelations.categoryLimits, expenseTransactions);
        const incomeStatuses = this.calculateIncomeStatuses(budgetWithRelations.incomeExpectations, incomeTransactions);
        const overallStats = this.calculateOverallStats(budget, expenseTransactions);
        const paceStats = this.calculatePaceStats(budget, overallStats.totalSpent);

        return {
            budget,
            overallLimit: convertFromMicroUnits(budget.overallLimit),
            ...overallStats,
            ...this.calculateAllocationStats(budget, categoryStatuses),
            categoryStatuses,
            incomeStatuses,
            ...this.calculateIncomeStats(incomeStatuses),
            ...paceStats,
            warningCount: categoryStatuses.filter(status => status.status !== BudgetStatusEnum.ON_TRACK).length
        };
    }

    private async getTransactionsByType(budget: BudgetEntityInterface): Promise<TransactionsByTypeInterface> {
        const excludedAccountIds = await accountBudgetExclusionRepository.getExcludedAccountIds();
        const transactions = await this.getTransactionsForBudget(budget, excludedAccountIds);

        return {
            expenseTransactions: transactions.filter(transaction => transaction.type === TransactionTypeEnum.EXPENSE),
            incomeTransactions: transactions.filter(transaction => transaction.type === TransactionTypeEnum.INCOME)
        };
    }

    private getStatus(percentage: number): BudgetStatusEnum {
        if (percentage >= 100) {
            return BudgetStatusEnum.OVER;
        }

        if (percentage >= 80) {
            return BudgetStatusEnum.WARNING;
        }

        return BudgetStatusEnum.ON_TRACK;
    }

    private calculateOverallStats(
        budget: BudgetEntityInterface,
        expenseTransactions: TransactionWithEntriesEntityInterface[]
    ): OverallStatsInterface {
        const totalSpentMicro = this.calculateTotalSpent(expenseTransactions);
        const overallRemainingMicro = budget.overallLimit - totalSpentMicro;
        const overallPercentage = budget.overallLimit > 0 ? (totalSpentMicro / budget.overallLimit) * 100 : 0;
        const overallStatus = this.getStatus(overallPercentage);

        return {
            totalSpent: convertFromMicroUnits(totalSpentMicro),
            overallRemaining: convertFromMicroUnits(overallRemainingMicro),
            overallPercentage,
            overallStatus
        };
    }

    private calculateAllocationStats(
        budget: BudgetEntityInterface,
        categoryStatuses: BudgetCategoryStatusInterface[]
    ): AllocationStatsInterface {
        const allocatedAmount = categoryStatuses.reduce((sum, status) => sum + status.limit, 0);
        const unallocatedBuffer = convertFromMicroUnits(budget.overallLimit) - allocatedAmount;

        return { allocatedAmount, unallocatedBuffer };
    }

    private calculateIncomeStats(incomeStatuses: BudgetIncomeStatusInterface[]): IncomeStatsInterface {
        const totalExpectedIncome = incomeStatuses.reduce((sum, status) => sum + status.expected, 0);
        const totalActualIncome = incomeStatuses.reduce((sum, status) => sum + status.actual, 0);
        const incomeVariance = totalActualIncome - totalExpectedIncome;

        return { totalExpectedIncome, totalActualIncome, incomeVariance };
    }

    private calculatePaceStats(budget: BudgetEntityInterface, totalSpent: number): PaceStatsInterface {
        const daysInPeriod = differenceInDays(budget.endDate, budget.startDate) + 1;
        const daysElapsed = Math.min(differenceInDays(new Date(), budget.startDate) + 1, daysInPeriod);
        const overallLimitDisplay = convertFromMicroUnits(budget.overallLimit);
        const dailyBudget = daysInPeriod > 0 ? overallLimitDisplay / daysInPeriod : 0;
        const expectedSpentByNow = dailyBudget * daysElapsed;
        const isOnPace = totalSpent <= expectedSpentByNow;
        const paceVariance = expectedSpentByNow - totalSpent;

        return { daysInPeriod, daysElapsed, dailyBudget, expectedSpentByNow, isOnPace, paceVariance };
    }

    private async getTransactionsForBudget(
        budget: BudgetEntityInterface,
        excludedAccountIds: number[]
    ): Promise<TransactionWithEntriesEntityInterface[]> {
        const transactions = await transactionRepository.getAll(10000, {
            types: [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME],
            date: { from: budget.startDate, to: budget.endDate },
            categoryIds: null,
            accountIds: null,
            tagIds: null
        });

        if (!isNotEmptyArray(excludedAccountIds)) {
            return transactions;
        }

        return transactions.filter(transaction => {
            const isFromExcluded = isDefined(transaction.fromAccountId) && excludedAccountIds.includes(transaction.fromAccountId);
            const isToExcluded = isDefined(transaction.toAccountId) && excludedAccountIds.includes(transaction.toAccountId);

            return !isFromExcluded && !isToExcluded;
        });
    }

    private calculateTotalSpent(expenseTransactions: TransactionWithEntriesEntityInterface[]): number {
        return expenseTransactions.reduce((total, transaction) => {
            const transactionTotal = transaction.entries.reduce((entryTotal, entry) => entryTotal + entry.amount, 0);

            return total + transactionTotal;
        }, 0);
    }

    private calculateCategoryStatuses(
        categoryLimits: BudgetCategoryLimitWithCategoryInterface[],
        expenseTransactions: TransactionWithEntriesEntityInterface[]
    ): BudgetCategoryStatusInterface[] {
        return categoryLimits.map(categoryLimit => {
            const spentMicro = this.calculateAmountForCategory(categoryLimit.categoryId, expenseTransactions);
            const remainingMicro = categoryLimit.limit - spentMicro;
            const percentage = categoryLimit.limit > 0 ? (spentMicro / categoryLimit.limit) * 100 : 0;
            const status = this.getStatus(percentage);

            return {
                category: categoryLimit.category,
                limit: convertFromMicroUnits(categoryLimit.limit),
                spent: convertFromMicroUnits(spentMicro),
                remaining: convertFromMicroUnits(remainingMicro),
                percentage,
                status
            };
        });
    }

    private calculateAmountForCategory(categoryId: number, transactions: TransactionWithEntriesEntityInterface[]): number {
        return transactions.reduce((total, transaction) => {
            const categoryEntries = transaction.entries.filter(entry => entry.categoryId === categoryId);
            const categoryTotal = categoryEntries.reduce((entryTotal, entry) => entryTotal + entry.amount, 0);

            return total + categoryTotal;
        }, 0);
    }

    private calculateIncomeStatuses(
        incomeExpectations: BudgetIncomeExpectationWithCategoryInterface[],
        incomeTransactions: TransactionWithEntriesEntityInterface[]
    ): BudgetIncomeStatusInterface[] {
        return incomeExpectations.map(incomeExpectation => {
            const actualMicro = this.calculateAmountForCategory(incomeExpectation.categoryId, incomeTransactions);
            const varianceMicro = actualMicro - incomeExpectation.expectedAmount;

            return {
                categoryId: incomeExpectation.categoryId,
                categoryName: incomeExpectation.category.title,
                expected: convertFromMicroUnits(incomeExpectation.expectedAmount),
                actual: convertFromMicroUnits(actualMicro),
                variance: convertFromMicroUnits(varianceMicro)
            };
        });
    }
}

export const budgetCalculationService = new BudgetCalculationService();
