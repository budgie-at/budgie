import { createSelectSchema } from 'drizzle-zod';

import { TransactionToTagEntityTable } from '../table/transaction-to-tag-entity.table';

export const TransactionToTagEntitySchema = createSelectSchema(TransactionToTagEntityTable, {
    transactionId: schema => schema.describe('The id of the transaction.'),
    tagId: schema => schema.describe('The id of the tag.')
});
