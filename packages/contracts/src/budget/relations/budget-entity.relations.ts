import { relations } from 'drizzle-orm';

import { BudgetAlertEntityTable } from '../../budget-alert/table/budget-alert-entity.table';
import { BudgetCategoryLimitEntityTable } from '../../budget-category-limit/table/budget-category-limit-entity.table';
import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetEntityRelations = relations(BudgetEntityTable, ({ many }) => ({
    categoryLimits: many(BudgetCategoryLimitEntityTable),
    alerts: many(BudgetAlertEntityTable)
}));
