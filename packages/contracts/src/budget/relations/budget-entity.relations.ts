import { relations } from 'drizzle-orm';

import { BudgetAlertSettingsEntityTable } from '../../budget-alert-settings/table/budget-alert-settings-entity.table';
import { BudgetCategoryLimitEntityTable } from '../../budget-category-limit/table/budget-category-limit-entity.table';
import { BudgetIncomeExpectationEntityTable } from '../../budget-income-expectation/table/budget-income-expectation-entity.table';
import { BudgetPeriodSnapshotEntityTable } from '../../budget-period-snapshot/table/budget-period-snapshot-entity.table';
import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetEntityRelations = relations(BudgetEntityTable, ({ many, one }) => ({
    categoryLimits: many(BudgetCategoryLimitEntityTable),
    incomeExpectations: many(BudgetIncomeExpectationEntityTable),
    alertSettings: one(BudgetAlertSettingsEntityTable),
    periodSnapshots: many(BudgetPeriodSnapshotEntityTable)
}));
