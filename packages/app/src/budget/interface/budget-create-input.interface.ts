import type { BudgetCategoryLimitInputInterface } from './budget-category-limit-input.interface';
import type { BudgetCreateEntityInterface } from '@budgie/contracts';

export interface BudgetCreateInputInterface extends BudgetCreateEntityInterface {
    readonly categoryLimits: readonly BudgetCategoryLimitInputInterface[];
}
