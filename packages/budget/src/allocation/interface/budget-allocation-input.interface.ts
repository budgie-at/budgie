import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';

export interface BudgetAllocationInputInterface {
    readonly overallLimit: number;
    readonly otherLimit: number;
    readonly categoryLimits: readonly BudgetCategoryLimitInputInterface[];
}
