import { TransferTransactionCreateInputSchema } from './transfer-transaction-create-input.schema';

export const BuyAssetTransactionCreateEntitySchema = TransferTransactionCreateInputSchema.superRefine(({ exchangeRate }, context) => {
    if (exchangeRate === 1) {
        context.addIssue({
            code: 'custom',
            path: ['exchangeRate'],
            message: 'buy asset transaction exchange rate must not be equal to 1'
        });
    }
});
