import type { CategoryCreateEntitySchema } from '../schema/category-create-entity.schema';
import type { infer } from 'zod';

export interface CategoryCreateEntityInterface extends infer<typeof CategoryCreateEntitySchema> {}
