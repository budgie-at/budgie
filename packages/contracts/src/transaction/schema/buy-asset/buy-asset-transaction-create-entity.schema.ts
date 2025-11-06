import { BuyAssetTransactionEntitySchema } from './buy-asset-transaction-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = BuyAssetTransactionEntitySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
}).partial({
    comment: true,
    operatedAt: true
});
