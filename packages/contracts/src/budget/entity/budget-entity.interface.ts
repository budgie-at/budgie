import { infer } from 'zod';

import { BudgetEntitySchema } from '../schema/budget-entity.schema';

export interface BudgetEntityInterface extends infer<typeof BudgetEntitySchema> {}
