import { z } from 'zod';

import { BankSyncEntitySchema } from '../schema/bank-sync-entity.schema';

export type BankSyncEntityInterface = z.infer<typeof BankSyncEntitySchema>;
