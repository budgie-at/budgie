import { IncomeAssetTransactionEntitySchema } from './income-asset-transaction-entity.schema';

export const IncomeAssetTransactionCreateEntitySchema = IncomeAssetTransactionEntitySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
}).partial({
    comment: true,
    operatedAt: true
});
