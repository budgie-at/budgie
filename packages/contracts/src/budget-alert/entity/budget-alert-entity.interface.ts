import { infer as zodInfer } from 'zod';

import { BudgetAlertEntitySchema } from '../schema/budget-alert-entity.schema';

export interface BudgetAlertEntityInterface extends zodInfer<typeof BudgetAlertEntitySchema> {}
