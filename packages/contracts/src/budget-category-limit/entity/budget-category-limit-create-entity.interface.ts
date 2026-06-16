import type { BudgetCategoryLimitCreateEntitySchema } from '../schema/budget-category-limit-create-entity.schema';
import type { z } from 'zod';

export type BudgetCategoryLimitCreateEntityInterface = z.infer<typeof BudgetCategoryLimitCreateEntitySchema>;
