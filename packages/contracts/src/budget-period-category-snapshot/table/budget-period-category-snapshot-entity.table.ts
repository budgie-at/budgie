import { sql } from 'drizzle-orm';
import { int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { BudgetPeriodSnapshotEntityTable } from '../../budget-period-snapshot/table/budget-period-snapshot-entity.table';
import { BudgetRolloverModeEnum } from '../../budget/enum/budget-rollover-mode.enum';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

export const BudgetPeriodCategorySnapshotEntityTable = sqliteTable(
    'budget_period_category_snapshots',
    withBaseEntityTableColumns({
        snapshotId: int('snapshot_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetPeriodSnapshotEntityTable.id, { onDelete: 'cascade' }),
        categoryId: int('category_id', { mode: 'number' })
            .notNull()
            .references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        limitAmount: int('limit_amount').notNull(),
        spent: int('spent').notNull(),
        carriedIn: int('carried_in').notNull().default(0),
        rolloverMode: text('rollover_mode', { enum: convertEnumToDrizzleEnum(BudgetRolloverModeEnum) })
            .$type<BudgetRolloverModeEnum>()
            .notNull()
            .default(BudgetRolloverModeEnum.NONE)
    }),
    table => [
        uniqueIndex('budget_period_category_snapshot_snapshot_category_unq')
            .on(table.snapshotId, table.categoryId)
            .where(sql`deleted_at IS NULL`)
    ]
);
