import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { InstrumentDailyMarketPriceEntityTable } from '../table/instrument-daily-market-price-entity.table';

export const InstrumentDailyMarketPriceEntitySchema = createSelectSchema(InstrumentDailyMarketPriceEntityTable, {
    ...BaseEntityFields,
    instrumentId: schema => schema.positive().describe('Id of the priced instrument.'),
    quoteInstrumentId: schema => schema.positive().describe('Id of the quote instrument.'),
    priceDate: schema => schema.describe('Market price date in YYYY-MM-DD format.'),
    price: schema => schema.positive().describe('Daily instrument price in the quote instrument.'),
    marketCap: schema => schema.positive().nullable().describe('Daily market capitalization in the quote instrument.'),
    volume: schema => schema.nonnegative().nullable().describe('Daily volume in the quote instrument.'),
    source: schema => schema.describe('Market data source.')
});
