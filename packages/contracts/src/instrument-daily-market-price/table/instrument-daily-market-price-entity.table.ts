import { sql } from 'drizzle-orm';
import { index, int, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';

export const InstrumentDailyMarketPriceEntityTable = sqliteTable(
    'instrument_daily_market_prices',
    withBaseEntityTableColumns({
        instrumentId: int('instrument_id', { mode: 'number' })
            .notNull()
            .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' }),
        quoteInstrumentId: int('quote_instrument_id', { mode: 'number' })
            .notNull()
            .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' }),
        priceDate: text('price_date').notNull(),
        price: real('price').notNull(),
        marketCap: real('market_cap'),
        volume: real('volume'),
        source: text('source').notNull()
    }),
    table => [
        unique().on(table.instrumentId, table.quoteInstrumentId, table.priceDate),
        index('instrument_daily_market_prices_lookup_idx')
            .on(table.instrumentId, table.quoteInstrumentId, sql`${table.priceDate} DESC`)
            .where(sql`${table.deletedAt} IS NULL`)
    ]
);
