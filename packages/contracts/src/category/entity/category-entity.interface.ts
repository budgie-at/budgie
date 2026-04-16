import { z } from 'zod';

import type { CategoryEntitySchema } from '../schema/category-entity.schema';

export type CategoryEntityInterface = z.infer<typeof CategoryEntitySchema>;
