import type { BudgetCreateEntitySchema } from '../schema/budget-create-entity.schema';
import type { z } from 'zod';

export type BudgetCreateEntityInterface = z.infer<typeof BudgetCreateEntitySchema>;
