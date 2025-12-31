import { BankSyncCreateEntitySchema } from '../schema/bank-sync-create-entity.schema';

import type { infer } from 'zod';

export interface BankSyncCreateEntityInterface extends infer<typeof BankSyncCreateEntitySchema> {}
