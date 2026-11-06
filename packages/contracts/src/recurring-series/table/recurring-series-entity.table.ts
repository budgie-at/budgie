import { sql } from 'drizzle-orm';
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { RecurringCadenceUnitEnum } from '../enum/recurring-cadence-unit.enum';
import { RecurringSeriesKindEnum } from '../enum/recurring-series-kind.enum';
import { RecurringSeriesSourceEnum } from '../enum/recurring-series-source.enum';
import { RecurringSeriesStatusEnum } from '../enum/recurring-series-status.enum';
import { RecurringSeriesUserStateEnum } from '../enum/recurring-series-user-state.enum';

export const RecurringSeriesEntityTable = sqliteTable(
    'recurring_series',
    withBaseEntityTableColumns({
        merchantKey: text('merchant_key').notNull(),
        kind: text('kind', { enum: convertEnumToDrizzleEnum(RecurringSeriesKindEnum) })
            .$type<RecurringSeriesKindEnum>()
            .notNull(),
        periodDays: int('period_days').notNull(),
        amount: int('amount').notNull(),
        status: text('status', { enum: convertEnumToDrizzleEnum(RecurringSeriesStatusEnum) })
            .$type<RecurringSeriesStatusEnum>()
            .notNull(),
        userState: text('user_state', { enum: convertEnumToDrizzleEnum(RecurringSeriesUserStateEnum) })
            .$type<RecurringSeriesUserStateEnum>()
            .notNull(),
        title: text('title').notNull(),
        categoryId: int('category_id').references(() => CategoryEntityTable.id, { onDelete: 'set null' }),
        lastSeenAt: int('last_seen_at', { mode: 'timestamp' }).notNull(),
        source: text('source', { enum: convertEnumToDrizzleEnum(RecurringSeriesSourceEnum) })
            .$type<RecurringSeriesSourceEnum>()
            .notNull()
            .default(RecurringSeriesSourceEnum.DETECTED),
        accountId: int('account_id', { mode: 'number' }).references(() => AccountEntityTable.id, { onDelete: 'set null' }),
        cadenceUnit: text('cadence_unit', { enum: convertEnumToDrizzleEnum(RecurringCadenceUnitEnum) })
            .$type<RecurringCadenceUnitEnum>()
            .notNull()
            .default(RecurringCadenceUnitEnum.MONTH),
        cadenceInterval: int('cadence_interval').notNull().default(1),
        anchorDate: int('anchor_date', { mode: 'timestamp' })
            .notNull()
            .default(sql`0`),
        instrumentId: int('instrument_id', { mode: 'number' }).references(() => InstrumentEntityTable.id),
        endsAt: int('ends_at', { mode: 'timestamp' }),
        reminderDaysBefore: int('reminder_days_before'),
        confidence: int('confidence').notNull().default(0)
    })
);
