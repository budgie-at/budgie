import { BudgetAllocationEntityInterface, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useMemo } from 'react';

import { calculateEffectivePlannedAmount } from '../util/calculate-effective-planned-amount.util';

interface SpendingByCategory {
    categoryId: number;
    total: number;
}

export interface CategoryStat {
    allocation: BudgetAllocationEntityInterface;
    name: string;
    icon: UserIconNameEnum;
    spent: number;
    planned: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
}

export const useCategoryStats = (
    allocations: BudgetAllocationEntityInterface[],
    categories: CategoryEntityInterface[],
    spendingByCategory: SpendingByCategory[],
    totalIncome: number
): { categoryStats: CategoryStat[]; categoriesOverBudget: number } => useMemo(() => {
        const stats = allocations.map(allocation => {
            const category = categories.find(cat => cat.id === allocation.categoryId);
            const spending = spendingByCategory.find(sp => sp.categoryId === allocation.categoryId);
            const spent = spending?.total ?? 0;
            const planned = calculateEffectivePlannedAmount(allocation, totalIncome);
            const catRemaining = planned - spent;
            const percentage = planned > 0 ? Math.round((spent / planned) * 100) : 0;
            const isOverBudget = spent > planned;

            return {
                allocation,
                name: category?.title ?? '-',
                icon: (category?.icon ?? UserIconNameEnum.Wallet) as UserIconNameEnum,
                spent,
                planned,
                remaining: catRemaining,
                percentage,
                isOverBudget
            };
        });

        const overBudgetCount = stats.filter(cat => cat.isOverBudget).length;

        return { categoryStats: stats, categoriesOverBudget: overBudgetCount };
    }, [allocations, categories, spendingByCategory, totalIncome]);

