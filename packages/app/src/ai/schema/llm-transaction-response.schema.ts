import { number, object, string } from 'zod';

const MIN_CATEGORY_ID = 1;

export const LlmTransactionResponseSchema = object({
    categoryId: number().int().min(MIN_CATEGORY_ID),
    amount: number(),
    currency: string().length(3).toUpperCase().optional()
});
