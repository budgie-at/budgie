import { BankSyncEntitySchema } from '../schema/bank-sync-entity.schema';

import type { infer } from 'zod';

export interface BankSyncEntityInterface extends infer<typeof BankSyncEntitySchema> {}
