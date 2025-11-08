import type { TransferTransactionCreateEntitySchema } from '../../schema/transfer-transaction-create-entity.schema';
import type { infer } from 'zod';

export interface TransferTransactionCreateEntityInterface extends infer<typeof TransferTransactionCreateEntitySchema> {}
