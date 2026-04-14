import { z } from 'zod';

import { BankSyncCreateEntitySchema } from '../schema/bank-sync-create-entity.schema';

export type BankSyncCreateEntityInterface = z.infer<typeof BankSyncCreateEntitySchema>;
