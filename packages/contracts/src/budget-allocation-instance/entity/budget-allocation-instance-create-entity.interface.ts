import type { BudgetAllocationInstanceCreateEntitySchema } from '../schema/budget-allocation-instance-create-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetAllocationInstanceCreateEntityInterface extends zodInfer<typeof BudgetAllocationInstanceCreateEntitySchema> {}

