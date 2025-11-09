import type { TransactionToTagEntitySchema } from '../schema/transaction-to-tag-entity.schema';
import type { infer } from 'zod';

export interface TransactionToTagEntityInterface extends infer<typeof TransactionToTagEntitySchema> {}
