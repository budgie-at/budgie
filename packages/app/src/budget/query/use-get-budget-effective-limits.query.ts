import { computeEffectiveLimits } from '@budgie/budget';

import { isDefined } from '@rnw-community/shared';

import { useGetBudgetCategoryLimitsQuery } from './use-get-budget-category-limits.query';
import { useGetBudgetPeriodSnapshotsQuery } from './use-get-budget-period-snapshots.query';

import type { BudgetEffectiveLimitsInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

const NO_BUDGET_LIMITS = { overallLimit: 0, otherLimit: 0 };

export const useGetBudgetEffectiveLimitsQuery = (
    budget: Pick<BudgetEntityInterface, 'id' | 'overallLimit' | 'otherLimit'> | null
): BudgetEffectiveLimitsInterface => {
    const budgetId = isDefined(budget) ? budget.id : null;
    const { categoryLimits } = useGetBudgetCategoryLimitsQuery(budgetId);
    const { snapshots } = useGetBudgetPeriodSnapshotsQuery(budgetId ?? 0);

    return computeEffectiveLimits(snapshots[0], isDefined(budget) ? budget : NO_BUDGET_LIMITS, categoryLimits);
};
