import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { RecurringSeriesKindEnum } from '../enum/recurring-series-kind.enum';
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
        lastSeenAt: int('last_seen_at', { mode: 'timestamp' }).notNull()
    })
);
