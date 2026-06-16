import type { BudgetEntitySchema } from '../schema/budget-entity.schema';
import type { z } from 'zod';

export type BudgetEntityInterface = z.infer<typeof BudgetEntitySchema>;
