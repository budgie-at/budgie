import { BudgetCreateEntitySchema } from './budget-create-entity.schema';

export const BudgetUpdateEntitySchema = BudgetCreateEntitySchema.partial();
