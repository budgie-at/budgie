import { array } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { IncomeTransactionEntitySchema } from './income-transaction-entity.schema';


export const IncomeTransactionCreateEntitySchema = convertToCreateEntitySchema(IncomeTransactionEntitySchema)
    .extend({
        [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema).min(1)
    })
    .superRefine(({ entries }, context) => {
        entries.forEach((transactionEntry, entryIndex) => {
            if (transactionEntry.type !== TransactionEntryTypeEnum.DEBIT) {
                context.addIssue({
                    code: 'custom',
                    path: [TransactionAssociationEnum.ENTRIES, entryIndex, 'type'],
                    message: "income entry must be 'debit' (inflow)."
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
