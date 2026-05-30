import { z } from 'zod';

import { HistoricalExchangeRateEntitySchema } from '../schema/historical-exchange-rate-entity.schema';

export type HistoricalExchangeRateEntityInterface = z.infer<typeof HistoricalExchangeRateEntitySchema>;
