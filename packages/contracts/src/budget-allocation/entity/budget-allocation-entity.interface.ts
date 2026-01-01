import { infer } from 'zod';

import { BudgetAllocationEntitySchema } from '../schema/budget-allocation-entity.schema';

export interface BudgetAllocationEntityInterface extends infer<typeof BudgetAllocationEntitySchema> {}
