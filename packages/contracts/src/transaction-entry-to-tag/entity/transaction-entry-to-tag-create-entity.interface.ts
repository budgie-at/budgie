import type { TransactionEntryToTagCreateEntitySchema } from '../schema/transaction-entry-to-tag-create-entity.schema';
import type { infer } from 'zod';

export interface TransactionEntryToTagCreateEntityInterface extends infer<typeof TransactionEntryToTagCreateEntitySchema> {}
