import { BudgetAllocationEntityInterface, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { calculateEffectivePlannedAmount } from '../util/calculate-budget-stats.util';

interface SpendingByCategory {
    categoryId: number;
    total: number;
}

export const useCategoryStats = (
    allocations: BudgetAllocationEntityInterface[],
    categories: CategoryEntityInterface[],
    spendingByCategory: SpendingByCategory[],
    totalIncome: number
) => {
    const stats = allocations.map(allocation => {
        const category = categories.find(cat => cat.id === allocation.categoryId);
        const spending = spendingByCategory.find(sp => sp.categoryId === allocation.categoryId);
        const spent = spending?.total ?? 0;
        const planned = calculateEffectivePlannedAmount(allocation, totalIncome);
        const catRemaining = planned - spent;
        const percentage = isPositiveNumber(planned) ? Math.round((spent / planned) * 100) : 0;
        const isOverBudget = spent > planned;

        return {
            allocation,
            name: category?.title ?? '-',
            icon: category?.icon ?? UserIconNameEnum.Wallet,
            spent,
            planned,
            remaining: catRemaining,
            percentage,
            isOverBudget
        };
    });

    const overBudgetCount = stats.filter(cat => cat.isOverBudget).length;

    return { categoryStats: stats, categoriesOverBudget: overBudgetCount };
};
