import { z } from 'zod';

import type { ExpenseTransactionEntitySchema } from '../schema/expense-transaction-entity.schema';

export type ExpenseTransactionEntityInterface = z.infer<typeof ExpenseTransactionEntitySchema>;
