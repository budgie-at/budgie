import { array } from 'zod';

import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { ExpenseTransactionCreateEntitySchema } from './expense-transaction-create-entity.schema';

export const BuyAssetTransactionCreateEntitySchema = ExpenseTransactionCreateEntitySchema.omit({
    [TransactionAssociationEnum.ENTRIES]: true
})
    .extend({
        [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema).length(2)
    })
    .superRefine(({ entries, exchangeRate }, context) => {
        const [entryA, entryB] = entries;

        if (entryA.accountId === entryB.accountId) {
            context.addIssue({
                code: 'custom',
                path: ['entries'],
                message: 'buy asset transaction entries must have different accounts'
            });

            return;
        }

        if (entryA.instrumentId === entryB.instrumentId) {
            context.addIssue({
                code: 'custom',
                path: ['entries'],
                message: 'buy asset transaction entries must have different instruments'
            });

            return;
        }

        if (exchangeRate === 1) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: 'buy asset transaction exchange rate must be > 1'
            });
        }
    });
