import { z } from 'zod';

import type { TransactionEntitySchema } from '../schema/transaction-entity.schema';

export type TransactionEntityInterface = z.infer<typeof TransactionEntitySchema>;
