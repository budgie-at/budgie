import { z } from 'zod';

import { SyncCreateEntitySchema } from '../schema/sync-create-entity.schema';

export type SyncCreateEntityInterface = z.infer<typeof SyncCreateEntitySchema>;
