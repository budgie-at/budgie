import { infer } from 'zod';
import { TransactionEntryCreateEntitySchema } from '../schema/transaction-entry-create-entity.schema';

export interface TransactionEntryCreateEntityInterface extends infer<typeof TransactionEntryCreateEntitySchema> {}
