import { infer as zodInfer } from 'zod';

import { BudgetCategoryLimitCreateInputSchema } from '../schema/budget-category-limit-create-input.schema';

export interface BudgetCategoryLimitCreateInputInterface extends zodInfer<typeof BudgetCategoryLimitCreateInputSchema> {}
