import { array } from 'zod';

import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { transferTransactionRefine } from '../refines/transfer-transaction.refine';

import { ExpenseTransactionCreateEntitySchema } from './expense-transaction-create-entity.schema';

export const SellAssetTransactionCreateEntitySchema = ExpenseTransactionCreateEntitySchema.omit({
    [TransactionAssociationEnum.ENTRIES]: true
})
    .extend({ [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema).length(2) })
    .superRefine(({ entries, exchangeRate }, context) => {
        transferTransactionRefine(entries, exchangeRate, context, {
            sameAccount: false,
            sameInstrument: false,
            stableExchangeRate: false
        });
    });
