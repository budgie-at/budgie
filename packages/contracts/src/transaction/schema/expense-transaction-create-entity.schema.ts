import { array } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { ExpenseTransactionEntitySchema } from './expense-transaction-entity.schema';

export const ExpenseTransactionCreateEntitySchema = convertToCreateEntitySchema(ExpenseTransactionEntitySchema)
    .extend({
        [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema).min(1)
    })
    .superRefine(({ entries }, context) => {
        entries.forEach((transactionEntry, entryIndex) => {
            if (transactionEntry.type !== TransactionEntryTypeEnum.CREDIT) {
                context.addIssue({
                    code: 'custom',
                    path: [TransactionAssociationEnum.ENTRIES, entryIndex, 'type'],
                    message: "expense entry must be 'credit' (outflow)."
                });
            }
        });

        const firstIndexByCategoryId = new Map<number, number>();
        entries.forEach((transactionEntry, entryIndex) => {
            const firstIdx = firstIndexByCategoryId.get(transactionEntry.categoryId);

            if (isDefined(firstIdx)) {
                context.addIssue({
                    code: 'custom',
                    path: [TransactionAssociationEnum.ENTRIES, entryIndex, 'categoryId'],
                    message: `categoryId must be unique across entries (also used at entries[${firstIdx}]).`
                });
            } else {
                firstIndexByCategoryId.set(transactionEntry.categoryId, entryIndex);
            }
        });
    });
