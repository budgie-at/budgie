import type { TransactionCreateEntitySchema } from '../schema/transaction-create-entity.schema';
import type { infer } from 'zod';

export interface TransactionCreateEntityInterface extends infer<typeof TransactionCreateEntitySchema> {}
