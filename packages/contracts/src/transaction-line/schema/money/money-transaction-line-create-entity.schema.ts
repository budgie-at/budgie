import { MoneyTransactionLineEntitySchema } from './money-transaction-line-entity.schema';

export const MoneyTransactionLineCreateEntitySchema = MoneyTransactionLineEntitySchema.pick({
    role: true,
    amount: true,
    accountId: true,
    transactionId: true
});
