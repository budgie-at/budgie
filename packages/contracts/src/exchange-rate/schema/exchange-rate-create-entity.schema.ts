import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';

import { ExchangeRateEntitySchema } from './exchange-rate-entity.schema';

export const ExchangeRateCreateEntitySchema = convertToCreateEntitySchema(ExchangeRateEntitySchema);
