import { array, number } from 'zod';

import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionCreateEntitySchema } from './transaction-create-entity.schema';

export const TransactionCreateInputSchema = TransactionCreateEntitySchema.extend({
    amount: number(),
    tagIds: array(number()),
    [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema.omit({ transactionId: true })).min(1)
});
