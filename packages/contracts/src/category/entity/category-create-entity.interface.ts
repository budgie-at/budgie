import { z } from 'zod';

import type { CategoryCreateEntitySchema } from '../schema/category-create-entity.schema';

export type CategoryCreateEntityInterface = z.infer<typeof CategoryCreateEntitySchema>;
