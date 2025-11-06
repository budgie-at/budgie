import { SellAssetTransactionEntitySchema } from './sell-asset-transaction-entity.schema';

export const SellAssetTransactionCreateEntitySchema = SellAssetTransactionEntitySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
}).partial({
    comment: true,
    operatedAt: true
});
