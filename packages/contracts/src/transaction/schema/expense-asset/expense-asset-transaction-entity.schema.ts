import { BaseTransferTransactionEntitySchema } from '../transfer/base-transfer-transaction-entity.schema';

export const ExpenseAssetTransactionEntitySchema = BaseTransferTransactionEntitySchema.omit({
    amount: true
}).required({
    quantity: true,
    instrument: true,
    pricePerUnit: true
});
