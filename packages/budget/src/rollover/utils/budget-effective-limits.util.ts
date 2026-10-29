import { computeSnapshotCarryOuts } from './budget-snapshot-carry-outs.util';

import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetCarrySourceInterface } from '../interface/budget-carry-source.interface';
import type { BudgetEffectiveLimitsInterface } from '../interface/budget-effective-limits.interface';
import type { BudgetEntityInterface } from '@budgie/contracts';

export const computeEffectiveLimits = (
    latestSnapshot: BudgetCarrySourceInterface | undefined,
    budget: Pick<BudgetEntityInterface, 'overallLimit' | 'otherLimit'>,
    categoryLimits: readonly Pick<BudgetCategoryLimitInputInterface, 'categoryId' | 'limitAmount'>[]
): BudgetEffectiveLimitsInterface => {
    const carryOuts = computeSnapshotCarryOuts(latestSnapshot);
    const effectiveCategoryLimits = categoryLimits.map(limit => {
        const carriedAmount = carryOuts.byCategory.get(limit.categoryId) ?? 0;

        return { categoryId: limit.categoryId, limitAmount: limit.limitAmount + carriedAmount, carriedAmount };
    });
    const totalCarriedAmount = effectiveCategoryLimits.reduce((total, limit) => total + limit.carriedAmount, carryOuts.other);

    return {
        overallLimit: budget.overallLimit + totalCarriedAmount,
        otherLimit: budget.otherLimit + carryOuts.other,
        otherCarriedAmount: carryOuts.other,
        categoryLimits: effectiveCategoryLimits
    };
};
