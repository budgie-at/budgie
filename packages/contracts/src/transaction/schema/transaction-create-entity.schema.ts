import { TransactionEntitySchema } from './transaction-entity.schema';

export const TransactionCreateEntitySchema = TransactionEntitySchema.pick({
    type: true,
    title: true,
    amount: true,
    comment: true,
    categoryId: true,
    operatedAt: true,
    toAccountId: true,
    fromAccountId: true,
}).partial({
    comment: true,
    operatedAt: true
});
