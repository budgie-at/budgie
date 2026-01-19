import { BudgetEntityInterface } from '@budgie/contracts';

import { BudgetStatusEnum } from '../enum/budget-status.enum';

import { BudgetCategoryStatusInterface } from './budget-category-status.interface';

export interface BudgetIncomeStatusInterface {
    readonly categoryId: number;
    readonly categoryName: string;
    readonly expected: number;
    readonly actual: number;
    readonly variance: number;
}

export interface BudgetCalculationResultInterface {
    readonly budget: BudgetEntityInterface;
    readonly totalSpent: number;
    readonly overallRemaining: number;
    readonly overallPercentage: number;
    readonly overallStatus: BudgetStatusEnum;
    readonly allocatedAmount: number;
    readonly unallocatedBuffer: number;
    readonly categoryStatuses: BudgetCategoryStatusInterface[];
    readonly incomeStatuses: BudgetIncomeStatusInterface[];
    readonly totalExpectedIncome: number;
    readonly totalActualIncome: number;
    readonly incomeVariance: number;
    readonly daysInPeriod: number;
    readonly daysElapsed: number;
    readonly dailyBudget: number;
    readonly expectedSpentByNow: number;
    readonly isOnPace: boolean;
    readonly paceVariance: number;
    readonly warningCount: number;
}
