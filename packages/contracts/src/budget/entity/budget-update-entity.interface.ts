import type { BudgetUpdateEntitySchema } from '../schema/budget-update-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetUpdateEntityInterface extends zodInfer<typeof BudgetUpdateEntitySchema> {}

