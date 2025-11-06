import { ExpenseAssetTransactionEntitySchema } from './expense-asset-transaction-entity.schema';

export const ExpenseAssetTransactionCreateEntitySchema = ExpenseAssetTransactionEntitySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
}).partial({
    comment: true,
    operatedAt: true
});
