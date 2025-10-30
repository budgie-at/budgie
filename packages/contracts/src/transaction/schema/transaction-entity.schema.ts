import { createSelectSchema } from 'drizzle-zod';

import { TransactionEntityTable } from '../table/transaction-entity.table';

export const TransactionEntitySchema = createSelectSchema(TransactionEntityTable);
