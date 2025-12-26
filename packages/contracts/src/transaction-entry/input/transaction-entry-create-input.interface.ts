import { infer } from 'zod';

import { TransactionEntryCreateInputSchema } from '../schema/transaction-entry-create-input.schema';

export interface TransactionEntryCreateInputInterface extends infer<typeof TransactionEntryCreateInputSchema> {
}
