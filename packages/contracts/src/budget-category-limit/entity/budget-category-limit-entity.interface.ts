import type { BudgetCategoryLimitEntitySchema } from '../schema/budget-category-limit-entity.schema';
import type { z } from 'zod';

export type BudgetCategoryLimitEntityInterface = z.infer<typeof BudgetCategoryLimitEntitySchema>;
