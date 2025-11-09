import type { TransferTransactionEntitySchema } from '../schema/transfer-transaction-entity.schema';
import type { infer } from 'zod';

export interface TransferTransactionEntityInterface extends infer<typeof TransferTransactionEntitySchema> {}
