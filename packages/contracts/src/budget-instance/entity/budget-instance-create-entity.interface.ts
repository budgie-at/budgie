import type { BudgetInstanceCreateEntitySchema } from '../schema/budget-instance-create-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetInstanceCreateEntityInterface extends zodInfer<typeof BudgetInstanceCreateEntitySchema> {}

