import { z } from 'zod';

import type { MccGroupCreateEntitySchema } from '../schema/mcc-group-create-entity.schema';

export type MccGroupCreateEntityInterface = z.infer<typeof MccGroupCreateEntitySchema>;
