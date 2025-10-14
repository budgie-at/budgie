import type { TransactionLineCreateEntitySchema } from '../schema/transaction-line-create-entity.schema';
import type { infer } from 'zod';

export interface TransactionLineCreateEntityInterface extends infer<typeof TransactionLineCreateEntitySchema> {}
