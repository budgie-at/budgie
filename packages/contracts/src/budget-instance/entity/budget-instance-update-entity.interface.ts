import type { BudgetInstanceUpdateEntitySchema } from '../schema/budget-instance-update-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetInstanceUpdateEntityInterface extends zodInfer<typeof BudgetInstanceUpdateEntitySchema> {}

