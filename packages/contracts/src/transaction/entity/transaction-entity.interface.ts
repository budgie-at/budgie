import type { TransactionEntitySchema } from '../schema/transaction-entity.schema';
import type { z } from 'zod';

export interface TransactionEntityInterface extends z.infer<typeof TransactionEntitySchema> {}
