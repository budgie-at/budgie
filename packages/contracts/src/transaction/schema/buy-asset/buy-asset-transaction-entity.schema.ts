import { BaseTransferTransactionEntitySchema } from '../transfer/base-transfer-transaction-entity.schema';

export const BuyAssetTransactionEntitySchema = BaseTransferTransactionEntitySchema.required({
    amount: true,
    quantity: true,
    instrument: true,
    toAccountId: true,
    pricePerUnit: true,
});
