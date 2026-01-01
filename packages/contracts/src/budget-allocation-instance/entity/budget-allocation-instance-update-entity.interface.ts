import type { BudgetAllocationInstanceUpdateEntitySchema } from '../schema/budget-allocation-instance-update-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetAllocationInstanceUpdateEntityInterface extends zodInfer<typeof BudgetAllocationInstanceUpdateEntitySchema> {}

