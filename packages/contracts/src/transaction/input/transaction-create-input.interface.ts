import { z } from 'zod';

import { TransactionCreateInputSchema } from '../schema/transaction-create-input.schema';

export type TransactionCreateInputInterface = z.infer<typeof TransactionCreateInputSchema>;
