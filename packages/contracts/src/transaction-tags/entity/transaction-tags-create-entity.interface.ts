import type { TransactionTagsCreateEntitySchema } from '../schema/transaction-tags-create-entity.schema';
import type { infer } from 'zod';

export interface TransactionTagsCreateEntityInterface extends infer<typeof TransactionTagsCreateEntitySchema> {}
