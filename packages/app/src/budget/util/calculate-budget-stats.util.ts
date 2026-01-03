import { BudgetAllocationTypeEnum, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { CategorySpendingInterface } from '../query/use-get-spending-by-category.query';

interface AllocationWithType {
    readonly allocationType: BudgetAllocationTypeEnum;
    readonly amount: number;
    readonly percentage: number;
    readonly categoryId: number | null;
}

export interface CategoryStatInterface {
    readonly name: string;
    readonly icon: UserIconNameEnum;
    readonly spent: number;
    readonly planned: number;
    readonly remaining: number;
    readonly percentage: number;
    readonly isOverBudget: boolean;
}

export const calculateEffectivePlannedAmount = (allocation: AllocationWithType, totalIncome: number): number => {
    if (allocation.allocationType === BudgetAllocationTypeEnum.PERCENTAGE) {
        return Math.round((totalIncome * allocation.percentage) / 100);
    }

    return allocation.amount;
};

export const calculateTotalPlannedAmount = (allocations: AllocationWithType[], totalIncome: number): number =>
    allocations.reduce((sum, allocation) => sum + calculateEffectivePlannedAmount(allocation, totalIncome), 0);

export const calculateCategoryStats = (
    allocations: AllocationWithType[],
    categories: CategoryEntityInterface[],
    spendingByCategory: CategorySpendingInterface[],
    totalIncome: number
): CategoryStatInterface[] =>
    allocations.map(allocation => {
        const category = categories.find(cat => cat.id === allocation.categoryId);
        const spending = spendingByCategory.find(sp => sp.categoryId === allocation.categoryId);
        const spent = spending?.total ?? 0;
        const planned = calculateEffectivePlannedAmount(allocation, totalIncome);
        const percentage = isPositiveNumber(planned) ? Math.round((spent / planned) * 100) : 0;

        return {
            spent,
            planned,
            percentage,
            remaining: planned - spent,
            name: category?.title ?? '-',
            isOverBudget: spent > planned,
            icon: category?.icon ?? UserIconNameEnum.Wallet
        };
    });

const UNDER_BUDGET_THRESHOLD = 50;

export const calculateBudgetCounts = (categoryStats: CategoryStatInterface[]): { overBudgetCount: number; underBudgetCount: number } => {
    let overBudgetCount = 0;
    let underBudgetCount = 0;

    for (const category of categoryStats) {
        if (category.isOverBudget) {
            overBudgetCount += 1;
        } else if (category.percentage < UNDER_BUDGET_THRESHOLD && isPositiveNumber(category.planned)) {
            underBudgetCount += 1;
        }
    }

    return { overBudgetCount, underBudgetCount };
};
