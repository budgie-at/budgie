import { sql } from 'drizzle-orm';
import { int, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';

export const BudgetPeriodSnapshotEntityTable = sqliteTable(
    'budget_period_snapshots',
    withBaseEntityTableColumns({
        budgetId: int('budget_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        periodStart: int('period_start', { mode: 'timestamp' }).notNull(),
        periodEnd: int('period_end', { mode: 'timestamp' }).notNull(),
        overallLimit: int('overall_limit').notNull(),
        overallSpent: int('overall_spent').notNull(),
        otherLimit: int('other_limit').notNull(),
        otherSpent: int('other_spent').notNull(),
        isReconstructed: int('is_reconstructed', { mode: 'boolean' }).notNull(),
        recapSeenAt: int('recap_seen_at', { mode: 'timestamp' })
    }),
    table => [
        uniqueIndex('budget_period_snapshot_budget_period_start_unq')
            .on(table.budgetId, table.periodStart)
            .where(sql`deleted_at IS NULL`)
    ]
);
