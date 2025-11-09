import { transferTransactionRefine } from '../refines/transfer-transaction.refine';

import { BaseTransferTransactionCreateEntitySchema } from './base-transfer-transaction-create-entity.schema';

export const TransferTransactionCreateEntitySchema = BaseTransferTransactionCreateEntitySchema.superRefine(
    (transaction, context) => {
        transferTransactionRefine(transaction, context, {
            sameAccount: false,
            sameInstrument: true,
            stableExchangeRate: true
        });
    }
);
