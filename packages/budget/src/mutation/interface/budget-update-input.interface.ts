import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetUpdateEntityInterface } from '@budgie/contracts';

export interface BudgetUpdateInputInterface extends BudgetUpdateEntityInterface {
    readonly categoryLimits?: readonly BudgetCategoryLimitInputInterface[];
}
