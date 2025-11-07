import { BaseTransferTransactionEntitySchema } from '../transfer/base-transfer-transaction-entity.schema';

export const SellAssetTransactionEntitySchema = BaseTransferTransactionEntitySchema.required({
    amount: true,
    quantity: true,
    instrument: true,
    toAccountId: true,
    pricePerUnit: true,
});
