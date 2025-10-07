import { TransactionEntitySchema } from '@/transaction';

export const TransactionCreateEntitySchema = TransactionEntitySchema.pick({
    type: true,
    title: true,
    amount: true,
    comment: true,
    accountId: true,
    operationDate: true
});
