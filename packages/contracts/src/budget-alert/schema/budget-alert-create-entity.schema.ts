import { BudgetAlertEntitySchema } from './budget-alert-entity.schema';

export const BudgetAlertCreateEntitySchema = BudgetAlertEntitySchema.pick({
    budgetId: true,
    periodStart: true,
    scope: true,
    categoryId: true,
    threshold: true
});
