import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { InstrumentDailyMarketPriceEntitySchema } from './instrument-daily-market-price-entity.schema';

export const InstrumentDailyMarketPriceCreateEntitySchema = convertToCreateEntitySchema(InstrumentDailyMarketPriceEntitySchema);
