import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';

import { TransferTransactionCreateEntitySchema } from './transfer-transaction-create-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = TransferTransactionCreateEntitySchema.superRefine(({ exchangeRate }, context) => {
    if (exchangeRate === convertToMicroUnits(1)) {
        context.addIssue({
            code: 'custom',
            path: ['exchangeRate'],
            message: 'buy asset transaction exchange rate must not be equal to 1'
        });
    }
});
