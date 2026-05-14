import { sql } from 'drizzle-orm';
import { check, int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetAlertScopeEnum } from '../enum/budget-alert-scope.enum';

export const BudgetAlertEntityTable = sqliteTable(
    'budget_alert',
    withBaseEntityTableColumns({
        budgetId: int('budget_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        periodStart: int('period_start', { mode: 'timestamp' }).notNull(),
        scope: text('scope', { enum: convertEnumToDrizzleEnum(BudgetAlertScopeEnum) })
            .$type<BudgetAlertScopeEnum>()
            .notNull(),
        categoryId: int('category_id', { mode: 'number' }).references(() => CategoryEntityTable.id, {
            onDelete: 'cascade'
        }),
        threshold: int('threshold').notNull(),
        dismissedAt: int('dismissed_at', { mode: 'timestamp' })
    }),
    table => [
        check(
            'budget_alert_scope_check',
            sql`(${table.scope} = 'OVERALL' AND ${table.categoryId} IS NULL) OR (${table.scope} = 'CATEGORY' AND ${table.categoryId} IS NOT NULL)`
        ),
        uniqueIndex('budget_alert_overall_unique')
            .on(table.budgetId, table.periodStart, table.threshold)
            .where(sql`${table.scope} = 'OVERALL'`),
        uniqueIndex('budget_alert_category_unique')
            .on(table.budgetId, table.periodStart, table.threshold, table.categoryId)
            .where(sql`${table.scope} = 'CATEGORY'`)
    ]
);
