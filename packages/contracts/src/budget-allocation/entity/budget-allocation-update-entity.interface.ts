import type { BudgetAllocationUpdateEntitySchema } from '../schema/budget-allocation-update-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetAllocationUpdateEntityInterface extends zodInfer<typeof BudgetAllocationUpdateEntitySchema> {}

