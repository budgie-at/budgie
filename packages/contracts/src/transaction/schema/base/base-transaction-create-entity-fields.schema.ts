import { TransactionEntitySchema } from '../transaction-entity.schema';

export const BaseTransactionCreateEntityFieldsSchema = TransactionEntitySchema.pick({
    note: true,
    type: true,
    title: true,
    operatedAt: true,
    categoryId: true
});
