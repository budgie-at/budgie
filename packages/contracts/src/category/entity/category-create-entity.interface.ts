import type { CategoryCreateEntitySchema } from '../schema/category-create-entity.schema';
import type { z } from 'zod';

export interface CategoryCreateEntityInterface extends z.infer<typeof CategoryCreateEntitySchema> {}
