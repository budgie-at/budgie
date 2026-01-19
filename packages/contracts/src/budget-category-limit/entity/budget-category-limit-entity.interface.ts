import { infer as zodInfer } from 'zod';

import { BudgetCategoryLimitEntitySchema } from '../schema/budget-category-limit-entity.schema';

export interface BudgetCategoryLimitEntityInterface extends zodInfer<typeof BudgetCategoryLimitEntitySchema> {}
