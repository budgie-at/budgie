import { createInsertSchema } from 'drizzle-zod';

import { CategoryEntityTable } from '../table/category-entity.table';

export const CategoryCreateEntitySchema = createInsertSchema(CategoryEntityTable);
