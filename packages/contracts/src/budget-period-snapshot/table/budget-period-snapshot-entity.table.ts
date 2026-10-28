import { sql } from 'drizzle-orm';
import { int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { BudgetRolloverModeEnum } from '../../budget/enum/budget-rollover-mode.enum';
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
        otherCarriedIn: int('other_carried_in').notNull().default(0),
        otherRolloverMode: text('other_rollover_mode', { enum: convertEnumToDrizzleEnum(BudgetRolloverModeEnum) })
            .$type<BudgetRolloverModeEnum>()
            .notNull()
            .default(BudgetRolloverModeEnum.NONE),
        isReconstructed: int('is_reconstructed', { mode: 'boolean' }).notNull(),
        recapSeenAt: int('recap_seen_at', { mode: 'timestamp' })
    }),
    table => [
        uniqueIndex('budget_period_snapshot_budget_period_start_unq')
            .on(table.budgetId, table.periodStart)
            .where(sql`deleted_at IS NULL`)
    ]
);
