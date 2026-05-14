import type { BudgetCategoryLimitInputInterface } from './budget-category-limit-input.interface';

export interface CategoryLimitDiffInterface {
    readonly toCreate: BudgetCategoryLimitInputInterface[];
    readonly toUpdate: { id: number; limitAmount: number }[];
    readonly toDelete: number[];
}
