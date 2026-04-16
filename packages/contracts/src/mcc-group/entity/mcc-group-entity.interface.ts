import { z } from 'zod';

import type { MccGroupEntitySchema } from '../schema/mcc-group-entity.schema';

export type MccGroupEntityInterface = z.infer<typeof MccGroupEntitySchema>;
