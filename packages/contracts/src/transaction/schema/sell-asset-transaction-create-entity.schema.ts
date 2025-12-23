import { TransferTransactionCreateEntitySchema } from './transfer-transaction-create-entity.schema';

export const SellAssetTransactionCreateEntitySchema = TransferTransactionCreateEntitySchema.superRefine(({ exchangeRate }, context) => {
    if (exchangeRate === 1) {
        context.addIssue({
            code: 'custom',
            path: ['exchangeRate'],
            message: 'sell asset transaction exchange rate must not be equal to 1'
        });
    }
});
