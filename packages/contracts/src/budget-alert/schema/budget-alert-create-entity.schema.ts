import { BudgetAlertEntitySchema } from './budget-alert-entity.schema';

export const BudgetAlertCreateEntitySchema = BudgetAlertEntitySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    dismissedAt: true
});
