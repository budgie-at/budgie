import { infer } from 'zod';

import { BudgetAllocationInstanceEntitySchema } from '../schema/budget-allocation-instance-entity.schema';

export interface BudgetAllocationInstanceEntityInterface extends infer<typeof BudgetAllocationInstanceEntitySchema> {}
