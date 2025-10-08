import type { TransactionCreateEntitySchema } from '../schema/transaction-create-entity.schema';
import type { z } from 'zod';

export interface TransactionCreateEntityInterface extends z.infer<typeof TransactionCreateEntitySchema> {}
