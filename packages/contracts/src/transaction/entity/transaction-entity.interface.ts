import type { TransactionEntitySchema } from '../schema/transaction-entity.schema';
import type { infer } from 'zod';


export interface TransactionEntityInterface extends infer<typeof TransactionEntitySchema> {}
