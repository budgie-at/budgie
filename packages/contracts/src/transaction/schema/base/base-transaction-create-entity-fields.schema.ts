import { TransactionEntitySchema } from '../transaction-entity.schema';

export const BaseTransactionCreateEntityFieldsSchema = TransactionEntitySchema.pick({
    type: true,
    title: true,
    comment: true,
    accountId: true,
    operatedAt: true,
    categoryId: true
});
