import { infer as zodInfer } from 'zod';

import { BudgetEntitySchema } from '../schema/budget-entity.schema';

export interface BudgetEntityInterface extends zodInfer<typeof BudgetEntitySchema> {}
