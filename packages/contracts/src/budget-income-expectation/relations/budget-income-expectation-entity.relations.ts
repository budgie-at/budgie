import { relations } from 'drizzle-orm';

import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetIncomeExpectationEntityTable } from '../table/budget-income-expectation-entity.table';

export const BudgetIncomeExpectationEntityRelations = relations(BudgetIncomeExpectationEntityTable, ({ one }) => ({
    budget: one(BudgetEntityTable, {
        fields: [BudgetIncomeExpectationEntityTable.budgetId],
        references: [BudgetEntityTable.id]
    }),
    category: one(CategoryEntityTable, {
        fields: [BudgetIncomeExpectationEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    })
}));
