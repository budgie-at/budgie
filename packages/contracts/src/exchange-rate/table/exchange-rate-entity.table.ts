import { int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const ExchangeRateEntityTable = sqliteTable(
    'exchange_rates',
    withBaseEntityTableColumns({
        source: text('source'),
        baseInstrumentId: int('base_instrument_id', { mode: 'number' }).notNull(),
        quoteInstrumentId: int('quote_instrument_id', { mode: 'number' }).notNull(),
        rate: int('rate', { mode: 'number' }).notNull()
    }),
    columns => ({
        uidxRateKey: uniqueIndex('u_idx_exchange_rates_key').on(columns.baseInstrumentId, columns.quoteInstrumentId, columns.source)
    })
);
