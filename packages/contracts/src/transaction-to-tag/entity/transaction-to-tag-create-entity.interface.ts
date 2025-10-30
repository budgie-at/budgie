import type { TransactionToTagCreateEntitySchema } from '../schema/transaction-to-tag-create-entity.schema';
import type { z } from 'zod';

export interface TransactionToTagCreateEntityInterface extends z.infer<typeof TransactionToTagCreateEntitySchema> {}
