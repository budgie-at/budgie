import type { BudgetAlertEntitySchema } from '../schema/budget-alert-entity.schema';
import type { z } from 'zod';

export type BudgetAlertEntityInterface = z.infer<typeof BudgetAlertEntitySchema>;
