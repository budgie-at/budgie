import { z } from 'zod';

import { SyncUpdateEntitySchema } from '../schema/sync-update-entity.schema';

export type SyncUpdateEntityInterface = z.infer<typeof SyncUpdateEntitySchema>;
