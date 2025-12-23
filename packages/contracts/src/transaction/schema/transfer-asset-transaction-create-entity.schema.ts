import { TransferTransactionCreateEntitySchema } from './transfer-transaction-create-entity.schema';

export const TransferAssetTransactionCreateEntitySchema = TransferTransactionCreateEntitySchema.superRefine(
    ({ exchangeRate }, context) => {
        if (exchangeRate !== 1) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: 'transfer asset transaction exchange rate must be equal to 1'
            });
        }
    }
);
