import { createSelectSchema } from 'drizzle-zod';

import { TransactionEntryToTagEntityTable } from '../table/transaction-entry-to-tag-entity.table';

export const TransactionEntryToTagEntitySchema = createSelectSchema(TransactionEntryToTagEntityTable, {
    transactionEntryId: schema => schema.describe('The id of the transaction-entry.'),
    tagId: schema => schema.describe('The id of the tag.')
});
