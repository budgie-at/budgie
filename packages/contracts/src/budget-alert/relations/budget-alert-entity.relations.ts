import { relations } from 'drizzle-orm';

import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetAlertEntityTable } from '../table/budget-alert-entity.table';

export const BudgetAlertEntityRelations = relations(BudgetAlertEntityTable, ({ one }) => ({
    budget: one(BudgetEntityTable, {
        fields: [BudgetAlertEntityTable.budgetId],
        references: [BudgetEntityTable.id]
    }),
    category: one(CategoryEntityTable, {
        fields: [BudgetAlertEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    })
}));
