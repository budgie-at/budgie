import { array, number, string } from 'zod';

import { TransactionEntryCreateInputSchema } from '../../transaction-entry/schema/transaction-entry-create-input.schema';

import { TransactionCreateEntitySchema } from './transaction-create-entity.schema';

export const TransactionCreateInputSchema = TransactionCreateEntitySchema.extend({
    amount: number(),
    debtAccountId: number().positive().nullable().optional(),
    externalIdAliases: array(string()).optional(),
    tagIds: array(number()),
    entries: array(TransactionEntryCreateInputSchema).min(1)
});
