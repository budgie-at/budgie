import { relations } from 'drizzle-orm';

import { BudgetCategoryLimitEntityTable } from '../../budget-category-limit/table/budget-category-limit-entity.table';
import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetEntityRelations = relations(BudgetEntityTable, ({ many }) => ({
    categoryLimits: many(BudgetCategoryLimitEntityTable)
}));
