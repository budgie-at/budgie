import { number, object } from 'zod';

export const BudgetCategoryLimitCreateInputSchema = object({
    categoryId: number().int().positive(),
    limit: number().int().positive()
});
