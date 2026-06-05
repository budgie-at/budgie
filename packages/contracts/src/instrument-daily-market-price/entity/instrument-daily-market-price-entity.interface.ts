import { z } from 'zod';

import { InstrumentDailyMarketPriceEntitySchema } from '../schema/instrument-daily-market-price-entity.schema';

export type InstrumentDailyMarketPriceEntityInterface = z.infer<typeof InstrumentDailyMarketPriceEntitySchema>;
