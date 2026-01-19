import { relations } from 'drizzle-orm';

import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { BudgetPeriodSnapshotEntityTable } from '../table/budget-period-snapshot-entity.table';

export const BudgetPeriodSnapshotEntityRelations = relations(BudgetPeriodSnapshotEntityTable, ({ one }) => ({
    budget: one(BudgetEntityTable, {
        fields: [BudgetPeriodSnapshotEntityTable.budgetId],
        references: [BudgetEntityTable.id]
    })
}));
