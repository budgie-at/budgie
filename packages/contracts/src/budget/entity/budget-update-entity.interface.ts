import type { BudgetUpdateEntitySchema } from '../schema/budget-update-entity.schema';
import type { z } from 'zod';

export type BudgetUpdateEntityInterface = z.infer<typeof BudgetUpdateEntitySchema>;
