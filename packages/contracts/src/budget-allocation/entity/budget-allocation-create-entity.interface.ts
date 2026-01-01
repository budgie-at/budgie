import type { BudgetAllocationCreateEntitySchema } from '../schema/budget-allocation-create-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetAllocationCreateEntityInterface extends zodInfer<typeof BudgetAllocationCreateEntitySchema> {}

