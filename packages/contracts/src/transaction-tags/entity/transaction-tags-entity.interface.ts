import type { TransactionTagsEntitySchema } from '../schema/transaction-tags-entity.schema';
import type { infer } from 'zod';

export interface TransactionTagsEntityInterface extends infer<typeof TransactionTagsEntitySchema> {}
