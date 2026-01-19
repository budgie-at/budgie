import type { BudgetAlertCreateEntitySchema } from '../schema/budget-alert-create-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetAlertCreateEntityInterface extends zodInfer<typeof BudgetAlertCreateEntitySchema> {}
