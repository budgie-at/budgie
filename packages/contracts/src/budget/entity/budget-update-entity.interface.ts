import type { BudgetCreateEntitySchema } from '../schema/budget-create-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetUpdateEntityInterface extends Partial<zodInfer<typeof BudgetCreateEntitySchema>> {}
