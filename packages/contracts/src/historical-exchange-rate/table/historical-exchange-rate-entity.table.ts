import { int, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';

export const HistoricalExchangeRateEntityTable = sqliteTable(
    'historical_exchange_rates',
    {
        sourceInstrumentId: int('source_instrument_id', { mode: 'number' })
            .notNull()
            .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' }),
        targetInstrumentId: int('target_instrument_id', { mode: 'number' })
            .notNull()
            .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' }),
        rateDate: text('rate_date').notNull(),
        rate: int('rate', { mode: 'number' }).notNull()
    },
    ({ sourceInstrumentId, targetInstrumentId, rateDate }) => [primaryKey({ columns: [sourceInstrumentId, targetInstrumentId, rateDate] })]
);
