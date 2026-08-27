import { z } from 'zod';

import { SyncEntitySchema } from '../schema/sync-entity.schema';

export type SyncEntityInterface = z.infer<typeof SyncEntitySchema>;
