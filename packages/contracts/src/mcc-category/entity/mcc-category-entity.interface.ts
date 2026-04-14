import { z } from 'zod';

import type { MccCategoryEntitySchema } from '../schema/mcc-category-entity.schema';

export type MccCategoryEntityInterface = z.infer<typeof MccCategoryEntitySchema>;
