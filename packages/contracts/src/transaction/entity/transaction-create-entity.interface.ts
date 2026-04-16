import { z } from 'zod';

import type { TransactionCreateEntitySchema } from '../schema/transaction-create-entity.schema';

export type TransactionCreateEntityInterface = z.infer<typeof TransactionCreateEntitySchema>;
