import { BudgetCategoryLimitEntityInterface, CategoryEntityInterface } from '@budgie/contracts';

export interface BudgetCategoryLimitWithCategoryInterface extends BudgetCategoryLimitEntityInterface {
    readonly category: CategoryEntityInterface;
}
