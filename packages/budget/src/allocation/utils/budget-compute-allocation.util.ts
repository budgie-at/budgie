import type { BudgetAllocationInputInterface } from '../interface/budget-allocation-input.interface';
import type { BudgetAllocationInterface } from '../interface/budget-allocation.interface';

export const budgetComputeAllocation = (input: BudgetAllocationInputInterface): BudgetAllocationInterface => {
    const categoryTotal = input.categoryLimits.reduce((sum, limit) => sum + limit.limitAmount, 0);
    const allocated = categoryTotal + input.otherLimit;
    const remaining = input.overallLimit - allocated;

    return { allocated, remaining, isOverAllocated: remaining < 0 };
};
