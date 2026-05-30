import { z } from 'zod';

import { HistoricalExchangeRateCreateEntitySchema } from '../schema/historical-exchange-rate-create-entity.schema';

export type HistoricalExchangeRateCreateEntityInterface = z.infer<typeof HistoricalExchangeRateCreateEntitySchema>;
