import type { BudgetAlertCreateEntitySchema } from '../schema/budget-alert-create-entity.schema';
import type { z } from 'zod';

export type BudgetAlertCreateEntityInterface = z.infer<typeof BudgetAlertCreateEntitySchema>;
