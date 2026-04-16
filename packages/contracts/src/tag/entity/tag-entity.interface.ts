import { z } from 'zod';

import type { TagEntitySchema } from '../schema/tag-entity.schema';

export type TagEntityInterface = z.infer<typeof TagEntitySchema>;
