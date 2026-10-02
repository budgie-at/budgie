import type { BudgetCategoryLimitEntityInterface } from './budget-category-limit-entity.interface';

export type BudgetCategoryLimitCreateEntityInterface = Pick<BudgetCategoryLimitEntityInterface, 'budgetId' | 'categoryId' | 'limitAmount'>;
