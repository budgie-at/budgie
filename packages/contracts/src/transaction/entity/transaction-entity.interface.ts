import { TransactionEntitySchema } from '../schema/transaction-entity.schema';
import { infer } from 'zod';

export interface TransactionEntityInterface extends infer<typeof TransactionEntitySchema> {}
