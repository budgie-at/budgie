import type { TransactionEntryToTagEntitySchema } from '../schema/transaction-entry-to-tag-entity.schema';
import type { infer } from 'zod';

export interface TransactionEntryToTagEntityInterface extends infer<typeof TransactionEntryToTagEntitySchema> {}
