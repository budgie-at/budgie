import { z } from 'zod';

import { BankSyncUpdateEntitySchema } from '../schema/bank-sync-update-entity.schema';

export type BankSyncUpdateEntityInterface = z.infer<typeof BankSyncUpdateEntitySchema>;
