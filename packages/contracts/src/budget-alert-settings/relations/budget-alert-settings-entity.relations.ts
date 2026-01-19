import { relations } from 'drizzle-orm';

import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { BudgetAlertSettingsEntityTable } from '../table/budget-alert-settings-entity.table';

export const BudgetAlertSettingsEntityRelations = relations(BudgetAlertSettingsEntityTable, ({ one }) => ({
    budget: one(BudgetEntityTable, {
        fields: [BudgetAlertSettingsEntityTable.budgetId],
        references: [BudgetEntityTable.id]
    })
}));
