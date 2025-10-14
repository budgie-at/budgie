import type { TransactionLineEntitySchema } from '../schema/transaction-line-entity.schema';
import type { infer } from 'zod';

export interface TransactionLineEntityInterface extends infer<typeof TransactionLineEntitySchema> {}
