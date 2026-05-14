import { BudgetEntitySchema } from './budget-entity.schema';

export const BudgetCreateEntitySchema = BudgetEntitySchema.pick({
    name: true,
    period: true,
    periodStartDay: true,
    useLastDayOfMonth: true,
    overallLimit: true,
    pushEnabled: true
});
