import type { BudgetAlertUpdateEntitySchema } from '../schema/budget-alert-update-entity.schema';
import type { z } from 'zod';

export type BudgetAlertUpdateEntityInterface = z.infer<typeof BudgetAlertUpdateEntitySchema>;
