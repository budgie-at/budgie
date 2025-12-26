import { infer } from 'zod';

import { TransactionCreateInputSchema } from '../schema/transaction-create-input.schema';

export interface TransactionCreateInputInterface extends infer<typeof TransactionCreateInputSchema> {}
