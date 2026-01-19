import { relations } from 'drizzle-orm';

import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetCategoryLimitEntityTable } from '../table/budget-category-limit-entity.table';

export const BudgetCategoryLimitEntityRelations = relations(BudgetCategoryLimitEntityTable, ({ one }) => ({
    budget: one(BudgetEntityTable, {
        fields: [BudgetCategoryLimitEntityTable.budgetId],
        references: [BudgetEntityTable.id]
    }),
    category: one(CategoryEntityTable, {
        fields: [BudgetCategoryLimitEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    })
}));
