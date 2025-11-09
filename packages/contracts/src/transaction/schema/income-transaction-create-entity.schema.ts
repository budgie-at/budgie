import { array } from 'zod';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { IncomeTransactionEntitySchema } from './income-transaction-entity.schema';

export const IncomeTransactionCreateEntitySchema = convertToCreateEntitySchema(IncomeTransactionEntitySchema)
    .extend({ [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema).min(1) })
    .superRefine(({ entries }, context) => {
        const [entry] = entries;

        if (entry.amount <= 0) {
            context.addIssue({ code: 'custom', path: ['entries'], message: 'income entry amount must be > 0' });
        }
    });
