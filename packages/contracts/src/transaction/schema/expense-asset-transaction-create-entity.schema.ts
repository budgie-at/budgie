import { array } from 'zod';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { ExpenseAssetTransactionEntitySchema } from './expense-asset-transaction-entity.schema';

export const ExpenseAssetTransactionCreateEntitySchema = convertToCreateEntitySchema(ExpenseAssetTransactionEntitySchema)
    .partial({ comment: true, operatedAt: true })
    .extend({ [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema).length(1) })
    .superRefine(({ entries }, context) => {
        const [entry] = entries;

        if (entry.amount >= 0) {
            context.addIssue({ code: 'custom', path: ['entries'], message: 'expense asset entry amount must be < 0' });
        }
    });
