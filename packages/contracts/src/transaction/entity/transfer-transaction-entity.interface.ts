import { z } from 'zod';

import type { TransferTransactionEntitySchema } from '../schema/transfer-transaction-entity.schema';

export type TransferTransactionEntityInterface = z.infer<typeof TransferTransactionEntitySchema>;
