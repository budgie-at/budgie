import { createSelectSchema } from 'drizzle-zod';

import { BudgetCategoryLimitEntityTable } from '../table/budget-category-limit-entity.table';

export const BudgetCategoryLimitEntitySchema = createSelectSchema(BudgetCategoryLimitEntityTable);
