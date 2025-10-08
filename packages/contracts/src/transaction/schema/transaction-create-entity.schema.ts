import { TransactionEntitySchema } from './transaction-entity.schema';

export const TransactionCreateEntitySchema = TransactionEntitySchema.pick({
    type: true,
    title: true,
    amount: true,
    comment: true,
    accountId: true,
    operationDate: true
});
