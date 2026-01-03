import { infer } from 'zod';

import { BudgetCreateInputSchema } from '../schema/budget-create-input.schema';

export interface BudgetCreateInputInterface extends infer<typeof BudgetCreateInputSchema> {}
