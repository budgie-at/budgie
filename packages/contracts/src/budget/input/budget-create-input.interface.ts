import { infer as zodInfer } from 'zod';

import { BudgetCreateInputSchema } from '../schema/budget-create-input.schema';

export interface BudgetCreateInputInterface extends zodInfer<typeof BudgetCreateInputSchema> {}
