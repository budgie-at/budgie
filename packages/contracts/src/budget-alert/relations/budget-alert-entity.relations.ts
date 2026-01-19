import { relations } from 'drizzle-orm';

import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { BudgetAlertEntityTable } from '../table/budget-alert-entity.table';

export const BudgetAlertEntityRelations = relations(BudgetAlertEntityTable, ({ one }) => ({
    budget: one(BudgetEntityTable, {
        fields: [BudgetAlertEntityTable.budgetId],
        references: [BudgetEntityTable.id]
    }),
    category: one(CategoryEntityTable, {
        fields: [BudgetAlertEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    }),
    transaction: one(TransactionEntityTable, {
        fields: [BudgetAlertEntityTable.transactionId],
        references: [TransactionEntityTable.id]
    })
}));
