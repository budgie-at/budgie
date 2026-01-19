import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';

export const BudgetPeriodSnapshotEntityTable = sqliteTable(
    'budget_period_snapshots',
    withBaseEntityTableColumns({
        budgetId: int('budget_id')
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        periodStart: int('period_start', { mode: 'timestamp' }).notNull(),
        periodEnd: int('period_end', { mode: 'timestamp' }).notNull(),
        overallLimit: int('overall_limit').notNull(),
        totalSpent: int('total_spent').notNull(),
        totalExpectedIncome: int('total_expected_income').notNull(),
        totalActualIncome: int('total_actual_income').notNull(),
        categoryLimitsJson: text('category_limits_json'),
        incomeExpectationsJson: text('income_expectations_json')
    })
);
