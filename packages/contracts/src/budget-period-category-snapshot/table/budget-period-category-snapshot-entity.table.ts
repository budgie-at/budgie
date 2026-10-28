import { sql } from 'drizzle-orm';
import { int, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { getBudgetCategoryLimitColumns } from '../../budget-category-limit/utils/get-budget-category-limit-columns.util';
import { BudgetPeriodSnapshotEntityTable } from '../../budget-period-snapshot/table/budget-period-snapshot-entity.table';

export const BudgetPeriodCategorySnapshotEntityTable = sqliteTable(
    'budget_period_category_snapshots',
    withBaseEntityTableColumns({
        snapshotId: int('snapshot_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetPeriodSnapshotEntityTable.id, { onDelete: 'cascade' }),
        spent: int('spent').notNull(),
        carriedIn: int('carried_in').notNull().default(0),
        ...getBudgetCategoryLimitColumns()
    }),
    table => [
        uniqueIndex('budget_period_category_snapshot_snapshot_category_unq')
            .on(table.snapshotId, table.categoryId)
            .where(sql`deleted_at IS NULL`)
    ]
);
