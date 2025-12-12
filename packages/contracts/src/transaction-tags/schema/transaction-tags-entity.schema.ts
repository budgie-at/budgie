import { createSelectSchema } from 'drizzle-zod';

import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

export const TransactionTagsEntitySchema = createSelectSchema(TransactionTagsEntityTable, {
    transactionId: schema => schema.describe('The id of the transaction.'),
    tagId: schema => schema.describe('The id of the tag.')
});
