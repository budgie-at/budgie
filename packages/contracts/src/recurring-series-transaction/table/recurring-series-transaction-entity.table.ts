import { sql } from 'drizzle-orm';
import { int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { RecurringSeriesEntityTable } from '../../recurring-series/table/recurring-series-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { RecurringMatchSourceEnum } from '../enum/recurring-match-source.enum';

export const RecurringSeriesTransactionEntityTable = sqliteTable(
    'recurring_series_transaction',
    withBaseEntityTableColumns({
        seriesId: int('series_id', { mode: 'number' })
            .notNull()
            .references(() => RecurringSeriesEntityTable.id, { onDelete: 'cascade' }),
        transactionId: int('transaction_id', { mode: 'number' })
            .notNull()
            .references(() => TransactionEntityTable.id, { onDelete: 'cascade' }),
        cycleDate: int('cycle_date', { mode: 'timestamp' }).notNull(),
        matchedBy: text('matched_by', { enum: convertEnumToDrizzleEnum(RecurringMatchSourceEnum) })
            .$type<RecurringMatchSourceEnum>()
            .notNull(),
        isExcluded: int('is_excluded', { mode: 'boolean' }).notNull().default(false)
    }),
    table => [
        uniqueIndex('recurring_series_transaction_series_transaction_unq').on(table.seriesId, table.transactionId),
        uniqueIndex('recurring_series_transaction_live_transaction_unq')
            .on(table.transactionId)
            .where(sql`${table.isExcluded} = 0 AND ${table.deletedAt} IS NULL`)
    ]
);
