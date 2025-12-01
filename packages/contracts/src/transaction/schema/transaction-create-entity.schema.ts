import { array, number } from 'zod';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';
import { TransactionEntryCreateEntitySchema } from '../../transaction-entry/schema/transaction-entry-create-entity.schema';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransactionEntitySchema } from './transaction-entity.schema';

export const TransactionCreateEntitySchema = convertToCreateEntitySchema(TransactionEntitySchema).extend({
    tagIds: number().array().describe('Array of tag IDs associated with the transaction'),
    [TransactionAssociationEnum.ENTRIES]: array(TransactionEntryCreateEntitySchema.omit({ transactionId: true })).min(1)
});
