import { createSelectSchema } from 'drizzle-zod';

import { CategoryEntityTable } from '../table/category-entity.table';

export const CategoryEntitySchema = createSelectSchema(CategoryEntityTable);
