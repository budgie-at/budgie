import { TransferTransactionCreateInputSchema } from './transfer-transaction-create-input.schema';

export const SellAssetTransactionCreateEntitySchema = TransferTransactionCreateInputSchema.superRefine(({ exchangeRate }, context) => {
    if (exchangeRate === 1) {
        context.addIssue({
            code: 'custom',
            path: ['exchangeRate'],
            message: 'sell asset transaction exchange rate must not be equal to 1'
        });
    }
});
