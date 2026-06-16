import type { BudgetCategoryLimitCreateEntityInterface } from '../entity/budget-category-limit-create-entity.interface';
import type { BudgetCategoryLimitEntityInterface } from '../entity/budget-category-limit-entity.interface';

export type BudgetCategoryLimitBulkUpdateInputInterface = Pick<BudgetCategoryLimitEntityInterface, 'id'> &
    Pick<BudgetCategoryLimitCreateEntityInterface, 'limitAmount'>;
