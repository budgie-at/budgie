import { TransferTransactionCreateInputSchema } from './transfer-transaction-create-input.schema';

export const TransferAssetTransactionCreateInputSchema = TransferTransactionCreateInputSchema.superRefine(({ exchangeRate }, context) => {
    if (exchangeRate !== 1) {
        context.addIssue({
            code: 'custom',
            path: ['exchangeRate'],
            message: 'transfer asset transaction exchange rate must be equal to 1'
        });
    }
});
