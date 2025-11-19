import type { CategoryUpdateEntitySchema } from '../schema/category-update-entity.schema';
import type { infer } from 'zod';

export interface CategoryUpdateEntityInterface extends infer<typeof CategoryUpdateEntitySchema> {}
