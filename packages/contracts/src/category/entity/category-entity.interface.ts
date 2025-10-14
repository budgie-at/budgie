import type { CategoryEntitySchema } from '../schema/category-entity.schema';
import type { infer } from 'zod';

export interface CategoryEntityInterface extends infer<typeof CategoryEntitySchema> {}
