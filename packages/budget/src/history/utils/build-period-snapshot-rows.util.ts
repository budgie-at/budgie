import type { BudgetCarryOutsInterface } from '../../rollover/interface/budget-carry-outs.interface';
import type { BudgetSpentInterface } from '../../spent/interface/budget-spent.interface';
import type { BudgetPeriodSnapshotRowsInterface } from '../interface/budget-period-snapshot-rows.interface';
import type { BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

export const buildPeriodSnapshotRows = (
    categoryLimits: readonly Pick<BudgetCategoryLimitEntityInterface, 'categoryId' | 'limitAmount' | 'rolloverMode'>[],
    spent: BudgetSpentInterface,
    carryIn: BudgetCarryOutsInterface
): BudgetPeriodSnapshotRowsInterface => {
    const spentByCategory = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));
    const categories = categoryLimits.map(limit => ({
        categoryId: limit.categoryId,
        limitAmount: limit.limitAmount,
        rolloverMode: limit.rolloverMode,
        carriedIn: carryIn.byCategory.get(limit.categoryId) ?? 0,
        spent: spentByCategory.get(limit.categoryId) ?? 0
    }));
    const limitedSpent = categories.reduce((total, category) => total + category.spent, 0);

    return { categories, otherSpent: Math.max(0, spent.spentOverall - limitedSpent), otherCarriedIn: carryIn.other };
};
