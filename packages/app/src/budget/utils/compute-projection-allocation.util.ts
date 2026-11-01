import { budgetComputeAllocation } from '@budgie/budget';

import type { BudgetProjectionInterface } from '@budgie/budget';

export const computeProjectionAllocation = (
    projection: Pick<BudgetProjectionInterface, 'overall' | 'other' | 'categories'>
): ReturnType<typeof budgetComputeAllocation> =>
    budgetComputeAllocation({
        overallLimit: projection.overall.limit,
        otherLimit: projection.other.limit,
        categoryLimits: projection.categories.map(category => ({ categoryId: category.categoryId, limitAmount: category.limit }))
    });
