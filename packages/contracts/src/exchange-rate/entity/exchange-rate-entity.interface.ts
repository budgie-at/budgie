import { infer } from 'zod';

import { ExchangeRateEntitySchema } from '../schema/exchange-rate-entity.schema';

export interface ExchangeRateEntityInterface extends infer<typeof ExchangeRateEntitySchema> {}
