import { infer } from 'zod';

import { BaseTransferTransactionCreateEntitySchema } from '../schema/base-transfer-transaction-create-entity.schema';

export interface BaseTransferTransactionCreateEntityInterface extends infer<typeof BaseTransferTransactionCreateEntitySchema> {}
