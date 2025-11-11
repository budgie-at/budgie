import { infer } from 'zod';

import { ExchangeRateCreateEntitySchema } from '../schema/exchange-rate-create-entity.schema';

export interface ExchangeRateCreateEntityInterface extends infer<typeof ExchangeRateCreateEntitySchema> {}
