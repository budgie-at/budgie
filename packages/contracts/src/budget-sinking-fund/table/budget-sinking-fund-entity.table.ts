import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { RecurringSeriesEntityTable } from '../../recurring-series/table/recurring-series-entity.table';

export const BudgetSinkingFundEntityTable = sqliteTable(
    'budget_sinking_funds',
    withBaseEntityTableColumns({
        budgetId: int('budget_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        categoryId: int('category_id', { mode: 'number' })
            .notNull()
            .references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        targetAmount: int('target_amount').notNull(),
        dueAt: int('due_at', { mode: 'timestamp' }).notNull(),
        repeatEveryMonths: int('repeat_every_months'),
        recurringSeriesId: int('recurring_series_id', { mode: 'number' }).references(() => RecurringSeriesEntityTable.id, {
            onDelete: 'set null'
        }),
        fundedAmount: int('funded_amount').notNull().default(0),
        lastFundedPeriodStart: int('last_funded_period_start', { mode: 'timestamp' })
    })
);
