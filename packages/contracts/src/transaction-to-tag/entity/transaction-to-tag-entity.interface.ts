import type { TransactionToTagEntitySchema } from '../schema/transaction-to-tag-entity.schema';
import type { z } from 'zod';

export interface TransactionToTagEntityInterface extends z.infer<typeof TransactionToTagEntitySchema> {}
