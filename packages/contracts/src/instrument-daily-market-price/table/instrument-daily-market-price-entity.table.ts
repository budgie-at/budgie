import { sql } from 'drizzle-orm';
import { index, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { instrumentPairTableColumns } from '../../@generic/utils/instrument-pair-table-columns.util';
import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';

export const InstrumentDailyMarketPriceEntityTable = sqliteTable(
    'instrument_daily_market_prices',
    withBaseEntityTableColumns({
        ...instrumentPairTableColumns(),
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
