import { AssetTransactionLineEntitySchema } from './asset-transaction-line-entity.schema';

export const AssetTransactionLineCreateEntitySchema = AssetTransactionLineEntitySchema.pick({
    role: true,
    quantity: true,
    accountId: true,
    pricePerUnit: true,
    instrumentId: true,
    transactionId: true
});
