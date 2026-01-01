import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { BudgetPeriodEnum } from '../enum/budget-period.enum';
import { BudgetStatusEnum } from '../enum/budget-status.enum';

export const BudgetEntityTable = sqliteTable(
    'budgets',
    withBaseEntityTableColumns({
        title: text('title').notNull(),
        period: text('period', { enum: convertEnumToDrizzleEnum(BudgetPeriodEnum) })
            .$type<BudgetPeriodEnum>()
            .notNull()
            .default(BudgetPeriodEnum.MONTHLY),
        status: text('status', { enum: convertEnumToDrizzleEnum(BudgetStatusEnum) })
            .$type<BudgetStatusEnum>()
            .notNull()
            .default(BudgetStatusEnum.DRAFT),
        startDay: int('start_day', { mode: 'number' }).notNull().default(1),
        customStartDate: int('custom_start_date', { mode: 'timestamp' }),
        customEndDate: int('custom_end_date', { mode: 'timestamp' }),
        instrumentId: int('instrument_id', { mode: 'number' })
            .notNull()
            .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' }),
        isTemplate: int('is_template', { mode: 'boolean' }).notNull().default(false),
        excludeTransfers: int('exclude_transfers', { mode: 'boolean' }).notNull().default(true),
        excludePending: int('exclude_pending', { mode: 'boolean' }).notNull().default(true),
        alertThreshold80: int('alert_threshold_80', { mode: 'boolean' }).notNull().default(true),
        alertThreshold100: int('alert_threshold_100', { mode: 'boolean' }).notNull().default(true)
    })
);

