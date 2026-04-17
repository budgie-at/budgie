import { z } from 'zod';

import type { TagUpdateEntitySchema } from '../schema/tag-update-entity.schema';

export type TagUpdateEntityInterface = z.infer<typeof TagUpdateEntitySchema>;
