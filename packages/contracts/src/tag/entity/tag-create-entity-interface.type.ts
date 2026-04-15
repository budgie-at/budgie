import { z } from 'zod';

import type { TagCreateEntitySchema } from '../schema/tag-create-entity.schema';

export type TagCreateEntityInterface = z.infer<typeof TagCreateEntitySchema>;
