import { createInsertSchema } from 'drizzle-zod';

import { TransactionToTagEntityTable } from '../table/transaction-to-tag-entity.table';

export const TransactionToTagCreateEntitySchema = createInsertSchema(TransactionToTagEntityTable);
