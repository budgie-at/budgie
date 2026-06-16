import type { BudgetCategoryLimitUpdateEntitySchema } from '../schema/budget-category-limit-update-entity.schema';
import type { z } from 'zod';

export type BudgetCategoryLimitUpdateEntityInterface = z.infer<typeof BudgetCategoryLimitUpdateEntitySchema>;
