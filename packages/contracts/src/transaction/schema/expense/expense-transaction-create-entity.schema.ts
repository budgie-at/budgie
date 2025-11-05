import { ExpenseTransactionEntitySchema } from './expense-transaction-entity.schema';

export const ExpenseTransactionCreateEntitySchema = ExpenseTransactionEntitySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
}).partial({
    comment: true,
    operatedAt: true,
});
