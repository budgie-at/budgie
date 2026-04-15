import { z } from 'zod';

import { ExchangeRateEntitySchema } from '../schema/exchange-rate-entity.schema';

export type ExchangeRateEntityInterface = z.infer<typeof ExchangeRateEntitySchema>;
