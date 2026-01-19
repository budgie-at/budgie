import { int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';

export const BudgetAlertSettingsEntityTable = sqliteTable(
    'budget_alert_settings',
    withBaseEntityTableColumns({
        budgetId: int('budget_id')
            .notNull()
            .unique()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        warningThreshold: int('warning_threshold').notNull().default(80),
        exceededThreshold: int('exceeded_threshold').notNull().default(100),
        largeExpenseThreshold: int('large_expense_threshold').notNull().default(10),
        paceAlertsEnabled: int('pace_alerts_enabled', { mode: 'boolean' }).notNull().default(true),
        predictiveAlertsEnabled: int('predictive_alerts_enabled', { mode: 'boolean' }).notNull().default(true),
        pushNotificationsEnabled: int('push_notifications_enabled', { mode: 'boolean' }).notNull().default(true)
    })
);
