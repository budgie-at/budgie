import { z } from 'zod';

import { TransactionEntryCreateEntitySchema } from '../schema/transaction-entry-create-entity.schema';

export type TransactionEntryCreateEntityInterface = z.infer<typeof TransactionEntryCreateEntitySchema>;
