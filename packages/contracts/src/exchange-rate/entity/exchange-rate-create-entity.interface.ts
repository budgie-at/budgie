import { z } from 'zod';

import { ExchangeRateCreateEntitySchema } from '../schema/exchange-rate-create-entity.schema';

export type ExchangeRateCreateEntityInterface = z.infer<typeof ExchangeRateCreateEntitySchema>;
