import { BaseTransactionEntitySchema } from './base-transaction-entity.schema';

export const BaseTransactionCreateEntitySchema = BaseTransactionEntitySchema.pick({
    note: true,
    type: true,
    title: true,
    operatedAt: true,
    categoryId: true
});
