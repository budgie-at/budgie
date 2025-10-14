import { TransactionLineEntitySchema } from './transaction-line-entity.schema';

export const TransactionLineCreateEntitySchema = TransactionLineEntitySchema.pick({
    role: true,
    amount: true,
    accountId: true
});
