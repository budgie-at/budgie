import { blob, int, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

export const ExchangeRateEntityTable = sqliteTable(
    'exchange_rates',
    withBaseEntityTableColumns({
        source: text('source'),
        baseInstrumentId: int('base_instrument_id', { mode: 'number' }).notNull(),
        quoteInstrumentId: int('quote_instrument_id', { mode: 'number' }).notNull(),
        rate: blob('rate', { mode: 'bigint' }).notNull()
    }),
    t => [unique().on(t.baseInstrumentId, t.quoteInstrumentId)]
);
