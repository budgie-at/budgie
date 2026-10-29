import type { BudgetFundCoveredInterface } from '../../fund/interface/budget-fund-covered.interface';
import type { BudgetCarryOutsInterface } from '../../rollover/interface/budget-carry-outs.interface';
import type { BudgetSpentInterface } from '../../spent/interface/budget-spent.interface';
import type { BudgetPeriodSnapshotRowsInterface } from '../interface/budget-period-snapshot-rows.interface';
import type { BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

export const buildPeriodSnapshotRows = (
    categoryLimits: readonly Pick<BudgetCategoryLimitEntityInterface, 'categoryId' | 'limitAmount' | 'rolloverMode'>[],
    spent: BudgetSpentInterface,
    carryIn: BudgetCarryOutsInterface,
    fundCovered: BudgetFundCoveredInterface
): BudgetPeriodSnapshotRowsInterface => {
    const spentByCategory = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));
    const categories = categoryLimits.map(limit => {
        const covered = fundCovered.byCategory.get(limit.categoryId) ?? 0;

        return {
            categoryId: limit.categoryId,
            limitAmount: limit.limitAmount,
            rolloverMode: limit.rolloverMode,
            carriedIn: carryIn.byCategory.get(limit.categoryId) ?? 0,
            fundCovered: covered,
            spent: Math.max((spentByCategory.get(limit.categoryId) ?? 0) - covered, 0)
        };
    });
    const limitedCovered = categoryLimits.reduce(
        (total, limit) => total + Math.min(fundCovered.byCategory.get(limit.categoryId) ?? 0, spentByCategory.get(limit.categoryId) ?? 0),
        0
    );
    const limitedSpent = categories.reduce((total, category) => total + category.spent, 0);
    const overallSpent = Math.max(0, spent.spentOverall - limitedCovered - fundCovered.other);

    return {
        categories,
        overallSpent,
        otherSpent: Math.max(0, overallSpent - limitedSpent),
        otherCarriedIn: carryIn.other,
        otherFundCovered: fundCovered.other
    };
};
