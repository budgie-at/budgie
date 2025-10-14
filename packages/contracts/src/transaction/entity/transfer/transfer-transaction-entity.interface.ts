import type { TransferTransactionEntitySchema } from '../../schema/transfer/transfer-transaction-entity.schema';
import type { infer } from 'zod';

export interface TransferTransactionEntityInterface extends infer<typeof TransferTransactionEntitySchema> {}
