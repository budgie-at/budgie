import { createSelectSchema } from 'drizzle-zod';

import { TransactionToTagEntityTable } from '../table/transaction-to-tag-entity.table';

export const TransactionToTagEntitySchema = createSelectSchema(TransactionToTagEntityTable);
