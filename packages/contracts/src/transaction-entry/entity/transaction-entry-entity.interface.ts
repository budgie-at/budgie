import { infer } from 'zod';

import { TransactionEntryEntitySchema } from '../schema/transaction-entry-entity.schema';

export interface TransactionEntryEntityInterface extends infer<typeof TransactionEntryEntitySchema> {}
