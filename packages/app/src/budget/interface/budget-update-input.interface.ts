import type { BudgetCategoryLimitInputInterface } from '@budgie/budget';
import type { BudgetUpdateEntityInterface } from '@budgie/contracts';

export interface BudgetUpdateInputInterface extends BudgetUpdateEntityInterface {
    readonly categoryLimits?: readonly BudgetCategoryLimitInputInterface[];
}
