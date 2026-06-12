import type { BudgetCategoryLimitUpdateInputInterface } from './budget-category-limit-update-input.interface';
import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';

export interface BudgetCategoryLimitDiffInterface {
    readonly toCreate: BudgetCategoryLimitInputInterface[];
    readonly toUpdate: BudgetCategoryLimitUpdateInputInterface[];
    readonly toDelete: number[];
}
