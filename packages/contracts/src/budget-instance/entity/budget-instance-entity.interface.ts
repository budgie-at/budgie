import { infer } from 'zod';

import { BudgetInstanceEntitySchema } from '../schema/budget-instance-entity.schema';

export interface BudgetInstanceEntityInterface extends infer<typeof BudgetInstanceEntitySchema> {}
