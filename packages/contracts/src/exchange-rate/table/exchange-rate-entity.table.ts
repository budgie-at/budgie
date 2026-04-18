import { sql } from 'drizzle-orm';
import { index, int, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

export const ExchangeRateEntityTable = sqliteTable(
    'exchange_rates',
    withBaseEntityTableColumns({
        source: text('source'),
        baseInstrumentId: int('base_instrument_id', { mode: 'number' }).notNull(),
        quoteInstrumentId: int('quote_instrument_id', { mode: 'number' }).notNull(),
        rate: int('rate', { mode: 'number' }).notNull()
    }),
    t => [
        unique().on(t.baseInstrumentId, t.quoteInstrumentId),
        index('exchange_rates_lookup_idx')
            .on(t.baseInstrumentId, t.quoteInstrumentId, sql`${t.createdAt} DESC`)
            .where(sql`${t.deletedAt} IS NULL`)
    ]
);
