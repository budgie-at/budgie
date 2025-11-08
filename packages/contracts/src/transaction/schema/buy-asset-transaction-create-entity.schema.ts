import { transferTransactionRefine } from '../refines/transfer-transaction.refine';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    ({ entries, exchangeRate }, context) => {
        transferTransactionRefine(entries, exchangeRate, context, {
            sameAccount: false,
            sameInstrument: false,
            stableExchangeRate: false
        });
    }
);
