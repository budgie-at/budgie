import { z } from 'zod';

import { InstrumentDailyMarketPriceCreateEntitySchema } from '../schema/instrument-daily-market-price-create-entity.schema';

export type InstrumentDailyMarketPriceCreateEntityInterface = z.infer<typeof InstrumentDailyMarketPriceCreateEntitySchema>;
