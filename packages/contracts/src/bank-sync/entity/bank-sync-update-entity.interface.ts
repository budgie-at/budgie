import { BankSyncUpdateEntitySchema } from '../schema/bank-sync-update-entity.schema';

import type { infer } from 'zod';

export interface BankSyncUpdateEntityInterface extends infer<typeof BankSyncUpdateEntitySchema> {}
