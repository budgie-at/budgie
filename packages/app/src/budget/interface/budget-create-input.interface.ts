import type { BudgetCategoryLimitInputInterface } from '@budgie/budget';
import type { BudgetCreateEntityInterface } from '@budgie/contracts';

export interface BudgetCreateInputInterface extends BudgetCreateEntityInterface {
    readonly categoryLimits: readonly BudgetCategoryLimitInputInterface[];
}
