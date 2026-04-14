import { z } from 'zod';

import { TransactionEntryCreateInputSchema } from '../schema/transaction-entry-create-input.schema';

export type TransactionEntryCreateInputInterface = z.infer<typeof TransactionEntryCreateInputSchema>;
