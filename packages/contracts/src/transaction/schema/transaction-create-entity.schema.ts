import { createInsertSchema } from 'drizzle-zod';

import { TransactionEntityTable } from '../table/transaction-entity.table';

export const TransactionCreateEntitySchema = createInsertSchema(TransactionEntityTable);
