import { z } from 'zod';

import { TransactionEntryEntitySchema } from '../schema/transaction-entry-entity.schema';

export type TransactionEntryEntityInterface = z.infer<typeof TransactionEntryEntitySchema>;
