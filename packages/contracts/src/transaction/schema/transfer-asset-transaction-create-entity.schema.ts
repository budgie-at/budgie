import { array } from 'zod';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransferAssetTransactionEntitySchema } from './transfer-asset-transaction-entity.schema';

export const TransferAssetTransactionCreateEntitySchema = convertToCreateEntitySchema(TransferAssetTransactionEntitySchema)
    .partial({ comment: true, operatedAt: true })
    .extend({ [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema).length(2) })
    .superRefine(({ entries, exchangeRate }, context) => {
        const [entryA, entryB] = entries;

        if (entryA.instrumentId !== entryB.instrumentId) {
            context.addIssue({
                code: 'custom',
                path: ['entries'],
                message: 'transfer asset transaction entries must have the same instrument'
            });

            return;
        }

        if (entryA.accountId === entryB.accountId) {
            context.addIssue({
                code: 'custom',
                path: ['entries'],
                message: 'transfer asset transaction entries must have different accounts'
            });

            return;
        }

        if (Math.abs(entryA.amount) !== Math.abs(entryB.amount)) {
            context.addIssue({
                code: 'custom',
                path: ['entries'],
                message: 'transfer asset transaction entries must have the same amount'
            });

            return;
        }

        if (exchangeRate !== 1) {
            context.addIssue({
                code: 'custom',
                path: ['exchangeRate'],
                message: 'transfer asset transaction exchange rate must be 1'
            });
        }
    });
