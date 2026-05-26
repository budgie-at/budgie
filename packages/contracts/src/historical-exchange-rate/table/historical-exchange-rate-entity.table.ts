import { sql } from 'drizzle-orm';
import { index, int, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';

export const HistoricalExchangeRateEntityTable = sqliteTable(
    'historical_exchange_rates',
    withBaseEntityTableColumns({
        sourceInstrumentId: int('source_instrument_id', { mode: 'number' })
            .notNull()
            .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' }),
        targetInstrumentId: int('target_instrument_id', { mode: 'number' })
            .notNull()
            .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' }),
        rateDate: text('rate_date').notNull(),
        rate: real('rate').notNull()
    }),
    table => [
        unique().on(table.sourceInstrumentId, table.targetInstrumentId, table.rateDate),
        index('historical_exchange_rates_lookup_idx')
            .on(table.sourceInstrumentId, table.targetInstrumentId, sql`${table.rateDate} DESC`)
            .where(sql`${table.deletedAt} IS NULL`)
    ]
);
