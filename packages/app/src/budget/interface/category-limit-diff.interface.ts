import type { BudgetCategoryLimitInputInterface } from '@budgie/budget';
import type { BudgetCategoryLimitBulkUpdateInputInterface } from '@budgie/contracts';

export interface CategoryLimitDiffInterface {
    readonly toCreate: BudgetCategoryLimitInputInterface[];
    readonly toUpdate: BudgetCategoryLimitBulkUpdateInputInterface[];
    readonly toDelete: number[];
}
