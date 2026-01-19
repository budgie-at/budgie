import { number, object } from 'zod';

export const BudgetIncomeExpectationCreateInputSchema = object({
    categoryId: number().int().positive(),
    expectedAmount: number().int().positive()
});
