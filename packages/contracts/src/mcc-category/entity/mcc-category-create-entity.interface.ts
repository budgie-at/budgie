import { z } from 'zod';

import type { MccCategoryCreateEntitySchema } from '../schema/mcc-category-create-entity.schema';

export type MccCategoryCreateEntityInterface = z.infer<typeof MccCategoryCreateEntitySchema>;
