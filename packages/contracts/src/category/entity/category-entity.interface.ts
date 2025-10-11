import type { CategoryEntitySchema } from '../schema/category-entity.schema';
import type { z } from 'zod';

export interface CategoryEntityInterface extends z.infer<typeof CategoryEntitySchema> {}
