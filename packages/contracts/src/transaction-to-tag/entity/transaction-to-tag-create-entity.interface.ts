import type { TransactionToTagCreateEntitySchema } from '../schema/transaction-to-tag-create-entity.schema';
import type { infer } from 'zod';

export interface TransactionToTagCreateEntityInterface extends infer<typeof TransactionToTagCreateEntitySchema> {}
