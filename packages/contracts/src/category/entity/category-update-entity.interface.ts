import { z } from 'zod';

import type { CategoryUpdateEntitySchema } from '../schema/category-update-entity.schema';

export type CategoryUpdateEntityInterface = z.infer<typeof CategoryUpdateEntitySchema>;
