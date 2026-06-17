import { BudgetCategoryLimitEntitySchema } from './budget-category-limit-entity.schema';

export const BudgetCategoryLimitCreateEntitySchema = BudgetCategoryLimitEntitySchema.pick({
    budgetId: true,
    categoryId: true,
    limitAmount: true
});
