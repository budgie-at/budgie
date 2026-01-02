import type { MccCategoryEntitySchema } from '../schema/mcc-category-entity.schema';
import type { infer } from 'zod';

export interface MccCategoryEntityInterface extends infer<typeof MccCategoryEntitySchema> {}
