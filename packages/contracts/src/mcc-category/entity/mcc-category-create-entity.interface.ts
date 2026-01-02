import type { MccCategoryCreateEntitySchema } from '../schema/mcc-category-create-entity.schema';
import type { infer } from 'zod';

export interface MccCategoryCreateEntityInterface extends infer<typeof MccCategoryCreateEntitySchema> {}
